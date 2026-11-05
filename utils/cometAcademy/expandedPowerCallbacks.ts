import type { PowerId } from './rules'

/**
 * What the protagonist's own field notices when they personally lead one of
 * the 24 expanded night cases. Each case answers the power it needs plus one
 * other field that plausibly matters there, so every power hears from exactly
 * eight cases. Lines describe what the hero perceives or attempts, never the
 * outcome, because they are shown before the roll and kept in the report
 * whatever the grade. They are flavor only: the odds come from dispatchModifier.
 */
export const EXPANDED_POWER_CALLBACKS: Readonly<
  Record<string, Partial<Record<PowerId, string>>>
> = {
  'frog-serum': {
    biotech:
      "You taste the solvent in the tower air before the alarm finishes. The janitor's lungs have minutes; Dr. Frog's webbing has hours.",
    empathy:
      "Under Dr. Frog's bluster is plain terror of being studied, not of dying. You keep the word 'specimen' out of your mouth all night.",
  },
  'mirror-court': {
    empathy:
      'Forty reflections cheer and one is holding its breath. You walk the hall with your eyes half closed, following the only fear in the room.',
    technopathy:
      'The mirrors hum on the same refresh rate as the prom ballot server. Nobody is haunting the theater; somebody is streaming to it.',
  },
  'stolen-hour': {
    spatial:
      'The observatory floor is a fraction of a step too short, as if an hour were folded into it. You set your anchors on both sides of the gap.',
    biotech:
      "Through the gate you count the missing patients' pulses, slowed to one beat a minute. Whatever holds them is keeping them alive, barely.",
  },
  'ghost-ticket': {
    technopathy:
      'The ticket machines are printing from a route table nobody in transit has ever opened. Even the printers sound ashamed of it.',
    spatial:
      'You touch the platform edge and find no distance behind it. The track ahead of the queue goes nowhere, so you plant yourself between the riders and the drop.',
  },
  'borrowed-faces': {
    empathy:
      'Seven identical faces, seven separate heartbeats of dread. You learn the riders by their fear before anyone shows you an ID.',
    biotech:
      'The faces are light laid over skin, not flesh rebuilt. Under the glow the riders have rashes from wearing it for too many shifts.',
  },
  'rail-heart': {
    kinetic:
      "You feel the flywheel's weight in your teeth from the yard gate. Every brace you set against it costs the old carriage a little more steel.",
    biotech:
      "The conductor's prosthetic heart is beating in step with the flywheel. Whatever you do to the engine, you do to them, so you keep one hand on their wrist.",
  },
  'granny-shuttle': {
    kinetic:
      'The bridge groans under a weight you can carry, but not gently. You choose which railings you are willing to bend before Granny reaches them.',
    elemental:
      'The floodwater wants the low road. You coax it toward the storm drain for a few dry yards, and a drizzle you did not order falls on the elders.',
  },
  'tomorrow-tide': {
    elemental:
      'You feel two tides in the harbor, one six hours early and wrong. The real sea is almost relieved to be asked where it wants to go.',
    spatial:
      'The far pier is three blocks and one locked gate from high ground. You fold the shortest block so the slowest families can walk it.',
  },
  'pearl-pact': {
    spatial:
      "The flooded tunnel is longer inside than the map says. You pin an anchor at the diver's last air pocket and hope it holds.",
    elemental:
      'The tunnel water is tide and broken main mixed together. You pull the cold seawater back a foot at a time so the diver can breathe between pulls.',
  },
  'halo-contract': {
    technopathy:
      "Hundreds of halos whisper the same 'yes' in perfect sync. One keeps muttering 'no' under the chorus, and that one is giving the orders.",
    kinetic:
      'The loading arms swing with factory strength and no judgment. You take their weight on your own shoulders so the workers can step out from under them.',
  },
  'hospital-saint': {
    biotech:
      "You read the ward like a chart. The treatments are holding; it is the patients' panic over the bills that is spiking their blood pressure.",
    empathy:
      'The ward is thick with a fear that has nothing to do with sickness. Every patient you pass is quietly doing arithmetic about rent.',
  },
  'lightning-election': {
    elemental:
      'The storm smells of copper and has no clouds behind it. You tell it it is not welcome, and your hair stands on end for the rest of the night.',
    kinetic:
      'You cannot stop lightning, but you can hold a canopy of folding tables over the voting line. You plant your feet and hope the steel legs do not conduct.',
  },
  'detention-moon': {
    spatial:
      'The little moon bends the gym into a bowl. You find the one seam where up is still up and lay your anchors along it like a ladder.',
    kinetic:
      "Lockers and trophies circle at speed. You pluck them out of orbit one by one, and the gym floor takes every dent you can't avoid.",
  },
  'promise-stairs': {
    empathy:
      "Every landing hums with somebody's guilt. You climb by finding the promises people still mean to keep; those steps are solid.",
    spatial:
      'Thirty floors stacked inside four. You count the folds the stairwell is hiding and know exactly how far up the student really is.',
  },
  'mascot-uprising': {
    biotech:
      'The roots are alive, and so is something sleeping inside the felt. Whatever it is, it is starving, not angry.',
    empathy:
      'Dozens of voices speak from the costume, each a performer who was told to leave quietly. You answer the youngest one first.',
  },
  'future-graduates': {
    spatial:
      'The express arrived from somewhere without a distance. You feel where it is trying to go and how little track it has left.',
    technopathy:
      'The train carries a timetable line nobody has written yet. You read the crash time off the departure board and start counting down.',
  },
  'rail-orchestra': {
    empathy:
      'The musicians are exhausted past fear. Under the compelled note, each of them is playing a different song they love.',
    technopathy:
      'The implants are running ad software on a looping license key. You can hear it renew itself at the top of every bar.',
  },
  'shadow-inspector': {
    technopathy:
      'The new turnstiles log every memory they take, each stamped with a vendor ID. The machines know exactly whose they are.',
    spatial:
      'A shadow should never stand this far from its owner. You feel the stretched distance between them like a rope about to snap.',
  },
  'double-lighthouse': {
    elemental:
      'You can feel which passage the squall is really leaving open. The true beam and the true wind agree; the false one does not.',
    technopathy:
      "The second beam isn't lighthouse glass. It flickers at a projector's frame rate, and the yacht's projector is practically bragging.",
  },
  'colossal-ring': {
    kinetic:
      'The ring is mostly seawall steel and wants to close. You hold it open with a strain you can feel in the docks behind you.',
    elemental:
      "The harbor current drags the boats toward the ring's mouth. You turn the tide a few degrees and keep their hulls off the metal.",
  },
  'cloud-zoo': {
    biotech:
      'The animals are made of something close to cloud and something close to blood. They are cold, hungry and nesting-season frantic.',
    elemental:
      'The creatures ride the fog like a current. Thicken it in the right places and you can steer them from the cranes without a hand on them.',
  },
  'shadow-court': {
    empathy:
      'The twelve shadows feel nothing at all. Real witnesses would be afraid; these are reading from a script.',
    kinetic:
      'The bailiffs move to seal the doors. You hold them open, one hand on each frame, so the accused can still walk out.',
  },
  'ambulance-detour': {
    technopathy:
      "Three navigation units are taking orders from a dispatch office that has no building. You can hear the server's billing loop counting patients.",
    biotech:
      'You feel three patients on life support across the city, two steady and one fading. You know which ambulance to reach first.',
  },
  'shield-auction': {
    kinetic:
      'The failing emitters push back as each shield comes down. You take as much of the skyline as your arms can hold.',
    elemental:
      'The meteor shoves hot wind ahead of it. You read the time left in the air pressure, and it is not much.',
  },
}

export function expandedPowerCallback(
  caseId: string,
  power: PowerId,
): string | null {
  return EXPANDED_POWER_CALLBACKS[caseId]?.[power] ?? null
}
