import type { SceneNode } from './sceneGraph'
import type { TrainingState } from './training'

const ROOFTOP_NODE_IDS: readonly string[] = [
  'o2',
  'oh',
  'ov',
  'c1',
  'c2',
  'cw',
  'cj',
  'w1',
  'j1',
  't1',
  'h1',
  's1',
  'vw',
  'vj',
  'd1',
]

export const PERSONAL_ROOFTOP_LINES: Readonly<
  Record<string, readonly string[]>
> = {
  'accident-fire': [
    'Two antenna pads, two rounds. The gas company bought airtime to bury the kitchen inspections; check the catwalk lanes before we cross.',
    'The engineer has the list of unsafe kitchen shutoffs. I want the cooks warned, not another employee threatened.',
    "The company's safety advertisements cost a fortune. I can make its next commercial very expensive.",
    'The emergency channel reaches the kitchens, but identifies the engineer. Jamming the patrol keeps her name private and the kitchens uninformed.',
    'I remember the rally crowd waiting for the all-clear. Do we send a warning or protect the person who can testify later?',
    "The vendors heard the warning. The engineer's call sign went out with it.",
    'Her identity is shielded. The cooks still have no list of the faulty shutoffs.',
    'Kitchen owners are closing their gas valves before the sirens reach the market.',
    'The patrol has gone quiet. We still owe the vendors a warning that does not put our witness on air.',
    'The west catwalk is buckling; it drops after next round. Clear it before the Licensed Legends get here.',
    'One round holding these pads. Keep the rivals off for one more; no safety report is worth losing a teammate.',
    'The second receiver is billed to the inspection contractor. Copy that invoice while we can.',
    'The cooks are evacuating, but the engineer will need protection after naming those kitchens on the radio.',
    'She escaped without being named. The gas company can still pretend every kitchen is safe.',
    "I couldn't get that warning past the antenna. The market is still waiting for an all-clear I cannot give.",
  ],
  'accident-air': [
    'Hold both antenna tiles for two rounds. Check the height and firing lanes; the airfield taught me what a bad forecast costs.',
    'Gliders are still above the harbor. The engineer can tell them where to land if we get her on air.',
    'The board paid to control the weather bulletin. I would like to decide who gets the next forecast.',
    'The emergency channel reaches airborne crews but exposes her identity. Jamming protects the engineer and leaves the gliders without the bulletin.',
    'I can survive an unexpected fall. Most of those pilots cannot. Do we send the bulletin or keep her identity safe?',
    "The gliders have the warning. The engineer's voice is now in every cockpit recording.",
    'Patrol radios are silent and her name is safe. The pilots are still using the old forecast.',
    'Ground crews are clearing landing strips along the harbor.',
    'The board cannot track her from this transmission; the wind has not stopped just because our radios did.',
    'The west catwalk is bowing in the gusts. It falls after next round; clear it before the Licensed Legends arrive.',
    'One round done, one to go. Keep the pads clear; do not chase a rival off the edge.',
    'The hidden receiver recorded the missing lightning alert. We can follow the account that bought it.',
    'Pilots are coming down safely. Their board now knows who sent the warning.',
    'She can testify anonymously later. Until then, those gliders have no reliable new forecast.',
    'We lost the frequency. I can reach the ground, but I cannot warn every pilot alone.',
  ],
  'accident-earth': [
    'Hold both antenna pads for two rounds. Check the roof levels and lines of fire; I have felt what happens when a support fails.',
    'The tunnel workers have waited years for a hearing. The engineer can send their warning without making her a prisoner.',
    "The planning office buried the foreman's report. I want the people above that office to hear it.",
    'Broadcasting the evacuation warning exposes the engineer. Jamming buys her cover but keeps the unstable districts in the dark.',
    "I spent nine days waiting for someone to answer. Do we call the neighborhoods or keep the witness out of the contractor's reach?",
    "The workers heard the call. The engineer's identity was part of the broadcast.",
    'The engineer is hidden. The people beneath the compromised buildings have not heard us.',
    'Sandhogs are guiding families away from the condemned streets.',
    'The contractor has lost its patrol signal, not its hold on the planning office.',
    'The west catwalk is bending at the joint. It drops after next round; move before the Licensed Legends arrive.',
    'One round on the pads. Brace our position for one more; leave the failing steel alone.',
    'The spare receiver carries the planning office account. Save the link to the suppressed quarry report.',
    'The crews know which streets to clear. The engineer cannot walk back into the office unnoticed.',
    'Her identity is protected, but the contractor still controls the story the workers hear.',
    'We could not hold the roof. Someone below is still waiting for the report that should have saved them.',
  ],
  'accident-water': [
    "Two elevated antenna pads, two rounds. Check the catwalk and the firing lanes; the riverfront cannot wait for the water board's next announcement.",
    'The engineer has a real riverfront warning. Get her out without treating her like another company specimen.',
    'The board edited the contamination bulletin. I want to own the microphone long enough to hear what it cut.',
    'The emergency channel warns the riverfront but identifies her. Jamming protects her and leaves the affected neighborhoods without the update.',
    'I remember the pond barrier failing. Do we warn the waterfront now or protect the person who can prove the board lied?',
    'The warning reached the riverfront. The board can trace it to our engineer.',
    "The patrol cannot identify her. The neighborhoods still have the board's old water bulletin.",
    'People are heading toward the dry streets before the water rises.',
    "The engineer can get clear unseen, but the board's public report is still unchallenged.",
    'The west catwalk is sagging under rainwater. It collapses after next round; leave it before the Licensed Legends arrive.',
    'One round held. Keep the pads for one more; we cannot send a warning from the flooded stairs.',
    'The second receiver belongs to a water-board contractor. Save the purchase record.',
    'The riverfront has its warning. The engineer deserves a safe place to stay after this.',
    'She escaped privately. The families still have to decide whether they trust the water board.',
    'The broadcast went to the rival. I know how long eleven minutes can last when nobody sends help.',
  ],
  'accident-discipline': [
    'Both antenna pads for two rounds. Check the height and sightlines before crossing; stolen seconds will not substitute for a held objective.',
    'The engineer can send an ordinary-speed warning. Nobody should need my fragment to have time to evacuate.',
    'The contractor sells exclusive timing windows. Tonight I intend to interrupt its schedule.',
    'The open emergency signal exposes the engineer; jamming protects her but delays the warning. The equipment cannot do both.',
    'Do we spend this broadcast window on the public or buy the witness time to disappear?',
    'The warning is out at ordinary speed. Her name is in the time-stamped log.',
    'Her identity is hidden. The neighborhoods have lost this transmission window.',
    'People are responding to the warning without having to match our clock.',
    'The patrol is behind schedule. The public warning never got its turn.',
    'The west catwalk fails after next round. Move now, not at the last instant, before the Licensed Legends arrive.',
    'One round elapsed. Hold one more, even if I can make a second feel longer.',
    "The hidden receiver is synchronized with the satellite contractor's test window. Copy the record.",
    'The warning reached the neighborhoods in time. The contractor can still trace our engineer through the log.',
    'She has time to escape. The public missed its opportunity to hear the warning.',
    'I could stretch a moment, not hold a rooftop alone. The rival owns the next broadcast window.',
  ],
  'accident-genius': [
    'Hold both antenna tiles for two rounds. Check elevation and sightlines; a correct model needs the squad to survive its assumptions.',
    'The engineer has an evacuation plan that neighbors can actually correct. She is not a variable we can discard.',
    'The company wants a convincing dataset. I would prefer one that exposes its methods.',
    'The warning makes her identifiable; the jammer hides her and suppresses the patrol. Neither option solves both constraints.',
    'Which failure can we live with: a named witness in danger, or an evacuation plan that never reaches the people it models?',
    'The neighbors have the plan, and her signature is in the broadcast record.',
    "The engineer is anonymous. Nobody outside can correct the company's evacuation assumptions.",
    'Residents are relaying corrections to the published warning as they leave.',
    'The patrol has lost its signal. Our model still lacks input from the neighborhoods.',
    "The west catwalk's supports are failing. It falls after next round; relocate before the Licensed Legends arrive.",
    'One round confirms our position. Hold the pads another round before drawing conclusions.',
    "The second receiver's dataset includes the edits to the pharmaceutical results. Keep the raw version.",
    "The evacuation plan is in public hands. Its author will need help against the company's response.",
    "We preserved the engineer's anonymity, not an independent public review.",
    'The rival gets to publish the result. I cannot call this experiment successful.',
  ],
  'accident-birthright': [
    'Two pads for two rounds. Watch height and firing lanes; a family crest is not a substitute for a squad holding ground.',
    "The engineer can name the ordinary rescuers the dynasty's advertisement ignored. We must not conscript her into our own publicity.",
    "My family's foundation bought this airtime. I could put my own terms on the next sponsorship contract.",
    'The open channel exposes the engineer; jamming keeps her anonymous but prevents the public evacuation warning.',
    'Do we let the ordinary rescuers be heard tonight, or shield the witness who knows which official buried their names?',
    'The rescuers are being named on air. The foundation can also identify the engineer.',
    "The engineer is safely anonymous; the family's logo still owns the public account.",
    'Neighborhood volunteers are acting on the warning without waiting for a cape to arrive.',
    'The patrol cannot trace the source. The foundation still has its version of events.',
    'The west catwalk fails after next round. Move before the Licensed Legends arrive; no heroic photograph is worth the fall.',
    'One round held. One more together; nobody gets to turn this into a solo pose.',
    'The spare receiver was paid for through the family trust. Keep that receipt out of the trophy room.',
    'The volunteers have their warning. We owe the engineer more than a congratulatory photograph.',
    'Her identity is safe. The ordinary rescuers remain absent from the broadcast.',
    'The crest could not keep the antenna. The family will offer a statement, but the neighborhoods needed a warning.',
  ],
  'accident-social': [
    'Hold the two antenna tiles for two rounds. Check height and firing lanes; a loud voice will not keep a catwalk standing.',
    'The engineer can warn people in ordinary speech. I want listeners to be able to turn it off.',
    'The broadcaster bought access to my voice. I want to know what an exclusive signal is worth to its patrons.',
    'The emergency warning identifies her; jamming protects her and cuts patrol radios. There is no secret third channel for both.',
    'Do we let people hear a warning they can refuse, or keep the engineer safe from the broadcaster who bought the last signal?',
    "The warning went out without the amplifier. The engineer's voice is now public.",
    'Her identity is shielded. People outside cannot choose to follow a warning they never heard.',
    'Listeners are sharing the ordinary spoken message and leaving at their own pace.',
    'The patrol is silent. We still have to find a way to warn people without taking over their radios.',
    'The west catwalk is failing. It drops after next round; move before the Licensed Legends arrive, even if the crowd is cheering.',
    "One round held. One more; don't let a rival lure you away from the pads.",
    "The second receiver is on the emotional amplifier contract. Save the buyer's name.",
    'The listeners chose to act on the warning. The engineer must not pay for their right to hear it.',
    "The engineer slipped out. The neighborhoods still heard the sponsor's version of the night.",
    'I can make a crowd listen, but I could not hold the antenna. Their choices still belong to them.',
  ],
}

export function personalRooftopNode(
  node: SceneNode,
  lead: string,
  stageId: string,
  campaign: boolean,
  state: Pick<TrainingState, 'crossfireCast' | 'units'>,
): SceneNode {
  if (
    !campaign ||
    stageId !== 'rooftop-broadcast' ||
    state.crossfireCast !== 2 ||
    !Object.hasOwn(PERSONAL_ROOFTOP_LINES, lead)
  )
    return node
  const index = ROOFTOP_NODE_IDS.indexOf(node.id)
  const text = PERSONAL_ROOFTOP_LINES[lead]?.[index]
  if (!text) return node
  const ally = state.units.find(
    (unit) => unit.team === 'squad' && unit.id !== 'backdraft' && unit.hp > 0,
  )
  const speaker = ['c1', 'cw', 'cj', 'w1', 'j1', 't1', 's1', 'vw', 'vj'].includes(
    node.id,
  )
    ? (ally?.id ?? 'backdraft')
    : 'backdraft'
  return { ...node, speaker, text }
}
