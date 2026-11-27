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
    !Object.hasOwn(ACCIDENT_SCIENCE_LINES, lead)
  )
    return node
  const index = SCIENCE_NODE_IDS.indexOf(node.id)
  const text = ACCIDENT_SCIENCE_LINES[lead]?.[index]
  if (!text) return node
  const ally = state.units.find(
    (unit) => unit.team === 'squad' && unit.id !== 'backdraft' && unit.hp > 0,
  )
  const speaker = ['d1', 'e1', 'r1'].includes(node.id)
    ? (ally?.id ?? 'backdraft')
    : 'backdraft'
  return { ...node, speaker, text }
}
