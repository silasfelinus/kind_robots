import type { SceneNode } from './sceneGraph'
import type { TrainingState } from './training'

// These are authored lines, not interpolated aftermath summaries. Keep the
// underlying scene graph, choice effects and saved trigger IDs unchanged.
const SCIENCE_NODE_IDS: readonly string[] = [
  'sv',
  'sh',
  'd1',
  'd2',
  'dr',
  'de',
  'k2',
  'e1',
  'r1',
  'v2',
  'f2',
]

export const ACCIDENT_SCIENCE_LINES: Readonly<
  Record<string, readonly string[]>
> = {
  'accident-fire': [
    'The gas company paid for these safety tests. I took their containment contract to get inside, not to make another kitchen burn.',
    'That valve bears the same stamp as the shutter at the food-truck rally. Get the researchers out before the company seals its second mistake.',
    'The isolation chamber holds a prototype shutoff valve. We can open the door or copy the invoices before the coolant reaches the recorder.',
    'I remember the cooks who pulled me through the smoke. A valve design can save the next kitchen; the invoices can stop the company selling another lie.',
    'The scientists are carrying a working shutoff valve. Get the repair instructions out with them.',
    'The invoices name the contractor who certified the old gas main. They can no longer call the test independent.',
    'Leave the rival a way out. I have seen what happens when the only exit becomes a weapon.',
    'The recorder survived. The kitchens deserve the original invoices, not another safety advertisement.',
    'The researchers are clear of the coolant. Ask them who should maintain the valve, rather than assuming the company owns the answer.',
    'I want every cook on that rally to be able to read the safety report. No more secret certification.',
    'Another shutter closed on people who trusted a safety stamp. I will not let their names disappear from the report.',
  ],
  'accident-air': [
    'The airfield board wants its wind tunnel back. I agreed to retrieve it because someone there knows why the lightning warning never reached us.',
    'I know that weather monitor. The airfield had one before the jump, and the warning was missing. We need the people who calibrated it.',
    'The technicians can carry out a portable monitor, or we can copy the calibration archive while the emergency circuit still has power.',
    'I can fly above a closed door; they cannot. The next rescue crew needs the forecast, and this board needs to answer for the last one.',
    'The portable monitor is outside. Tell the ground crews how to read it before anybody launches.',
    'The original calibration file includes the warning the board buried. We have their timestamps.',
    'I know what falling feels like. Give the rival a route to the floor instead of another reason to panic.',
    'The archive records exactly when the lightning alert was withheld. Copy it before anyone calls this a glitch.',
    'The technicians have the monitor and its manual. They get to decide who receives their warnings.',
    'Nobody should need a reckless jump to find out the weather report was wrong.',
    'The shutters beat us to the ground. I owe the technicians more than an excuse about bad visibility.',
  ],
  'accident-earth': [
    'The contractor wants the structural model returned. I want to know why the quarry reports and this lab use the same certification numbers.',
    'That load sensor could have warned the quarry crew before the collapse. Get its researchers somewhere they can explain the readings.',
    'The emergency circuit can lift the isolation door or preserve the load-test records. There is not enough power for both.',
    'I spent nine days under stone. A sensor in the hands of the workers matters; so does proof somebody certified rock they never examined.',
    'The researchers are out with their sensor. Let the tunnel crews decide how to maintain it.',
    'The load reports list samples nobody tested. Save the original measurements alongside the signatures.',
    'Nobody deserves to be buried because the patrol lost its footing. Move them away from the failing structure.',
    'The contractor signed a test without a sample. Those numbers belong in the inquiry.',
    'The researchers can explain the sensor to the workers themselves. Keep the passage clear for them.',
    'A building is safe when the people beneath it can challenge the numbers, not when the owner says so.',
    'The load report will not carry a person out of this room. I have to account for the people we missed.',
  ],
  'accident-water': [
    'The power company calls this containment. Its fittings look exactly like the coolant valves on my school tour. I am not handing over my medical file unread.',
    'My school tour ended in the pond below those fittings. The researchers know what happened to the barrier. They are people, not evidence lockers.',
    'The isolation chamber holds the medical files. We can evacuate its researchers or copy the inspection record that authorized the tour.',
    'I want the truth about my eleven minutes underwater. I also want the witnesses alive to tell it in their own words.',
    'The researchers are safe with the medical records. Ask permission before releasing a single personal detail.',
    'The failed barrier inspection was filed before the tour. Keep the date and approval together.',
    'Pull the injured rival out of the live water. Nobody has to earn the right to breathe.',
    'The company approved the tour after the barrier failed. That is the record we needed.',
    'The witnesses are out of the chamber. Their medical information stays theirs.',
    'No company gets to call a frightened person a specimen and file them under successful containment.',
    'The coolant kept rising while we fought. I cannot let the company write this as another successful experiment.',
  ],
  'accident-discipline': [
    'The contractor says this timing mechanism is proprietary. I recognize the signature of the satellite that changed my life. I need to see what it was built to do.',
    'Listen to the shutter motor. Its timing is slipping in the same pattern as the satellite experiment. Get the technician clear.',
    "The emergency relay gives us one window. We can open the isolation chamber or capture the timing experiment's original records.",
    'I can stretch a second, not manufacture another chance. Do we spend it on the door or preserve proof of why the clock failed?',
    'The technician is through the door. Keep the evacuation route open while the mechanism catches up.',
    'The archived experiment names the intended timing offset. Save it before the contractor resets the clock.',
    'The fallen rival has missed a beat. That is not an invitation to take their next second away.',
    'The timing data survived the reset. The accident was not the experiment they advertised.',
    'The technician is clear. Stop counting seconds long enough to let the witnesses speak.',
    'A second belongs to the person living through it, not the company that owns the clock.',
    'I had one window and still let the shutter close. The people inside deserved better than my arithmetic.',
  ],
  'accident-genius': [
    'The company wants the prototype returned to its patent vault. I want the notebook explaining who removed the label from the batch that changed me.',
    'Those researchers built a working prototype. Somebody hid the batch review. Get them out where the original notebook can be read.',
    'The backup circuit can open the chamber or copy the notebook before the coolant erases its entries. We cannot route both.',
    'A result without a reproducible method is an advertisement. We can preserve the people who built it or the record of who skipped the review.',
    'The prototype and repair instructions are outside. Do not separate the two.',
    'The notebook lists the unlabeled batch and the bypassed review. Keep the raw entries, not just a screenshot of the conclusion.',
    'A wounded rival is not a rounding error. Let them withdraw from the workstations.',
    'The raw notebook survived. Anyone can now inspect the skipped review.',
    'The researchers have their prototype and instructions. Ask them how the design should be shared.',
    'I want a result somebody else can reproduce without becoming another unapproved experiment.',
    'We lost the lab. The researchers are not variables I can subtract to make the result look better.',
  ],
  'accident-birthright': [
    "My family's trust funded this equipment. It wants the patents back before anyone reads the invoices. I would like to know what my inherited cape has been paying for.",
    'The crest on that grant belongs to my family. If the trust paid to hide an earlier failure, the researchers deserve protection before it learns we found them.',
    "The chamber can be opened with the emergency power, or the grant invoices can be copied. The trust's lawyers will arrive before we get a second chance.",
    'I inherited the cape, not the right to bury the people who made it possible. We need either living witnesses or records they cannot purchase back.',
    'The researchers are out with the trust-funded equipment. They can name their own independent overseers.',
    'The invoices identify the grant that covered the earlier failure. Preserve the original signatures.',
    "An inherited title is not a license to punish someone who has surrendered. Clear the rival's exit.",
    "The grant record is intact. My family's crest does not exempt it from the hearing.",
    "The researchers have their equipment. Nobody wearing my family's colors gets to dictate their testimony.",
    'If the cape means anything, it must survive somebody asking who paid for it.',
    'The trust will praise this operation. I will not accept praise while the researchers are behind a closed shutter.',
  ],
  'accident-social': [
    'The broadcaster wants its amplifier returned. I took the contract because I know what an involuntary emotional response sounds like from the inside.',
    'That amplifier was testing feelings without consent. We need the researchers out before someone broadcasts a reassuring lie over their voices.',
    'The chamber door and the response-trace archive share the emergency circuit. We can evacuate the researchers or recover the original trial records.',
    'I could calm this whole hallway with a song. That does not make it right. Let the witnesses choose their own words, or preserve proof someone stole that choice.',
    'The researchers are out using hand signals. Offer the calming song; do not impose it.',
    'The response traces show exactly where the broadcaster removed consent. Keep the unedited recording.',
    'Do not turn the patrol into an angry audience. Let the rival leave without a chorus of threats.',
    'The trial traces survived. They show which feelings were induced rather than volunteered.',
    'The researchers can choose whether to speak, sing or leave in silence. They owe us none of those things.',
    'A quiet hallway is not proof everyone agreed. The witnesses get to decide what the city hears.',
    'The broadcaster will call the silence a successful response. We know the difference between silence and consent.',
  ],
}

export const MAGIC_SCIENCE_LINES: Readonly<
  Record<string, readonly string[]>
> = {
  'magic-fire': [
    'The lab has put a bound flame inside a cooling circuit. My familiar wants me to take the apparatus from the people who paid for it.',
    'The salamander can feel something burning without permission behind that glass. Find the researchers before the shutters close.',
    'Emergency power can release the scientists or save the recording of how the flame was bound. The switch will only make one circuit.',
    'Ask the salamander what it wants, but the people behind that door are not payment for an answer.',
    'The researchers are out. Let them tell us how to release the flame without turning it into another captive.',
    "The recording shows who signed the binding order. Keep the original, not a version edited by the familiar's anger.",
    'Put down the lantern while the rival gets up. A surrender is not a bargain for their soul.',
    'The footage is evidence, not a license for our familiar to burn the signatories.',
    "The scientists have escaped the circuit. We can hear the creature's account without making them speak for it.",
    'One less locked door, one more question about what we owe each other.',
    'The candle is still burning, but we lost the people who could have explained its cage.',
  ],
  'magic-air': [
    "The ventilation alarm is singing a prohibited measure from the storm book. Someone has sold the library's forbidden notes to the Academy.",
    'The coolant is moving in time with a spell from the missing pages. Stop the shutters before the researchers run out of air.',
    'The emergency switch can free the researchers or preserve the recording of the storm experiment.',
    'I can quiet the air long enough to hear the warning. Decide which of those circuits needs the remaining power.',
    'The scientists are outside. Give them a dry place to explain how the notes entered the ventilation system.',
    'The recording contains the full measure, including the pause the council removed. Do not play it in a crowded room.',
    'Let the fallen rival finish a sentence before the next gust.',
    'The footage and the forbidden measure belong in an inquiry, not a concert.',
    'The researchers know which parts of the score can be taught safely. Ask them before we reopen the stacks.',
    'The storm book needs an index of warnings, not another locked cabinet.',
    "I listened to the alarm's tune and missed the people calling from behind it.",
  ],
  'magic-earth': [
    "Those bolts have the landlord's seal on them. If I own the lab's deed, I can keep the city from letting another building fall.",
    'The shutters are stitched into the load-bearing walls. Someone has used a perfectly good ward to trap the people it should shelter.',
    'One circuit will open the chamber; the other can save the recording of the alterations to the building.',
    'I can mend a seam in a wall, but I cannot sew up both of those emergencies with one thread.',
    'The researchers are through. Take them to the courtyard, not a room somebody else can lock.',
    "The footage shows who ordered the shutters closed. Keep a copy where the building's occupants can inspect it.",
    "That rival is somebody's neighbor. Do not stitch their boots to the floor when they are trying to leave.",
    "We have the record of the building alterations. The tenants' council can ask the questions in person.",
    'The three scientists are safe. Give them a chair at the meeting even if they dislike my plans.',
    'I will mend a roof for a person who votes against me. That is how a decent ward ought to work.',
    'I have repaired walls for decades. Tonight I let a perfectly repairable building become a prison.',
  ],
  'magic-water': [
    'The coolant carries reflections from the entire science wing. A buyer could pay dearly to know what the bowl sees in it.',
    'The bowl shows an empty lab, but I can hear the researchers behind the glass. Believe the people, not the reflection.',
    'Emergency power can open their chamber or save the security footage before the coolant floods the recorder.',
    'The future in the bowl has two empty spaces. Pick the circuit; I refuse to pretend either outcome is already certain.',
    'The scientists are standing here in the present. Ask what happened rather than what my reflection predicts.',
    'The footage shows a real event with a timestamp. Keep it separate from every vision in the bowl.',
    'The fallen rival is not doomed just because I saw them on the floor. Offer an exit.',
    'The recording survived. It is a witness to the past, not an exclusive forecast of the future.',
    'The researchers can speak for themselves. Do not ask the bowl to invent their testimony.',
    'Tomorrow is still available to the people who walked out of this room.',
    'The reflection looked clear until the last shutter fell. I mistook a possible escape for a completed rescue.',
  ],
  'magic-discipline': [
    'The lab has installed a threshold that admits its patrons and bars its staff. It reminds me of the order I intend to replace.',
    'That locked chamber has the same kind of gate the monastery used against refugees. No one should need a sponsor to get out.',
    "One relay can release the researchers or preserve the record of the administrators' orders.",
    'A rescue is not an initiation. Choose which duty we can complete while the gate is still movable.',
    'The researchers are outside the threshold. They do not owe our order a vow for shelter.',
    'The recording names the administrators who turned the chamber into a test. Let them answer in public.',
    'Offer sanctuary to the fallen rival without asking them to join the dojo.',
    'The evidence is ready for the hearing. Bring objections from our own squad as well.',
    'The scientists have a shelter route that does not lead through a loyalty test.',
    'I will keep the dojo door open even to someone who disputes my authority.',
    'The threshold closed while we argued. I have heard masters call that discipline before.',
  ],
  'magic-genius': [
    'The lab has converted my stolen proof into a physical containment system. I want the missing axiom before the faculty bury it.',
    'The shutter follows a geometric theorem with a boundary condition removed. Three researchers are inside its counterexample.',
    'The emergency relay can open the chamber or retain the camera record of the experimental geometry.',
    'One switch, two objectives. Do not confuse an elegant solution with a proof that everybody is safe.',
    'The researchers have crossed the boundary. Invite them to check my derivation before we use it again.',
    'The recording preserves the omitted axiom and who authorized the experiment. Retain the failed trial as well.',
    'A fallen opponent is a counterexample to our plan, not a term we can erase.',
    'The unedited record can be checked by someone who never studied under my professor.',
    'The scientists are clear of the diagram. Their consent belongs outside the equations.',
    'I want a theorem that survives a dissenting reader, not a city forced to obey it.',
    'The chamber contradicted my model. Leaving out the people behind the glass did not make the proof true.',
  ],
  'magic-birthright': [
    "My mother's handwriting is on that containment ward. The ancestors insist the laboratory owes the family its findings.",
    'The ward has confused a protective boundary with a lock. If my mother wrote it, we still have to help the people inside.',
    'The backup power will let us open the ward or retain the recording of who invoked it.',
    'I cannot consult a room full of dead relatives while three living people wait for an answer. Choose the circuit.',
    'The researchers are outside. A bowl of soup and a warm seat are more urgent than their pedigree.',
    "The recording shows who ordered the ward closed. My family's handwriting is part of the evidence, not an exemption.",
    "The rival's family name does not make them responsible for an inherited quarrel. Let them withdraw.",
    'The footage has survived the ward. I will ask the living witnesses before consulting the grimoire.',
    'The researchers have a place outside the family boundary. They may choose whether to help me find my mother.',
    'The hearth is for the living, even when the dead object to the guest list.',
    'The ancestors offered conflicting advice and the door closed. I still have no answer about my mother.',
  ],
  'magic-social': [
    "The lab's research contract smells of the crossroads. The spirit wants the footage, and I want to know whose signatures it bought.",
    "That seal is a glamour over a locked door. The researchers behind it are not extras in somebody else's show.",
    'The switch can open the isolation chamber or save the recordings that name the people who signed the lockdown.',
    "There is no encore for this choice. Keep the audience's exit clear while we decide what to preserve.",
    'The scientists are off the stage. Do not ask for applause or a signature before they can leave.',
    'The recording identifies the people behind the contract. Keep the original audio even if it makes our performance look bad.',
    'Give the rival a route backstage. A person who stops fighting has not agreed to join the show.',
    'The unedited footage belongs to the inquiry, not to the spirit that offered to buy it.',
    'The researchers are out of the spotlight. Let them decide whether to speak at all.',
    "The audience can walk away from my next show without paying somebody else's debt.",
    'I missed the exit cue while chasing a better reveal. The people inside did not volunteer for that ending.',
  ],
}

export const PERSONAL_SCIENCE_LINES: Readonly<
  Record<string, readonly string[]>
> = { ...ACCIDENT_SCIENCE_LINES, ...MAGIC_SCIENCE_LINES }

/** Personalize only the fixed-cast campaign, never studio or one-shot scripts. */
export function personalScienceNode(
  node: SceneNode,
  lead: string,
  stageId: string,
  campaign: boolean,
  state: Pick<TrainingState, 'crossfireCast' | 'units'>,
): SceneNode {
  if (
    !campaign ||
    stageId !== 'science-lab' ||
    state.crossfireCast !== 2 ||
    !Object.hasOwn(PERSONAL_SCIENCE_LINES, lead)
  )
    return node
  const index = SCIENCE_NODE_IDS.indexOf(node.id)
  const text = PERSONAL_SCIENCE_LINES[lead]?.[index]
  if (!text) return node
  const ally = state.units.find(
    (unit) => unit.team === 'squad' && unit.id !== 'backdraft' && unit.hp > 0,
  )
  const speaker = ['d1', 'e1', 'r1'].includes(node.id)
    ? (ally?.id ?? 'backdraft')
    : 'backdraft'
  return { ...node, speaker, text }
}
