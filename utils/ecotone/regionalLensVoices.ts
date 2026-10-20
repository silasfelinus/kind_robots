import type { EncounterCard } from './content'

/**
 * Observations follow the voluntary opening lens, never alter what actually
 * happened or impose morality, companion affinity or a special truth.
 * The underlying investigation and care outcomes stay exactly the same.
 */
export const REGIONAL_LENS_VOICES: Record<
  string,
  NonNullable<EncounterCard['lensLines']>
> = {
  'WH-005': {
    sober:
      'The clock, the receipts and the food delivery disagree. Start with the only thing that will spoil while everyone is arguing.',
    tipsy:
      'Two customers are debating which county owns the sidewalk. The driver would settle for somebody owning a refrigerator.',
    stoned:
      'The clock has taken a minute from everyone at once. The vegetables are still quietly conducting business as usual.',
    tripping_balls:
      'At thirteen chimes the map seems to fold into a paper hat. The driver puts it on the dashboard, where it is again only a map.',
    cocaine:
      'Three deadlines, two addresses and one truck of produce. You write down the next useful action instead of chasing all of them.',
    meth: 'Every receipt bears a different time. The grocer can cross-check them while you find somewhere less noisy to sit.',
    mdma: 'The driver is scared of failing the customers. Kindness can be a phone call and a working fridge, without anybody agreeing on time.',
  },
  'WH-028': {
    sober:
      'A press badge cannot establish that a salmon is a reliable source. A permit number, however, can be checked.',
    tipsy:
      'The fish insists on being off the record. You have met human sources with less demanding public-relations officers.',
    stoned:
      'The river keeps its own routes. You notice how carefully the salmon avoids naming the places it wants to protect.',
    tripping_balls:
      'The fish is holding a press conference in a language mostly composed of silence. It still understands the word private.',
    cocaine:
      'There is a story here, and an immediate temptation to publish it. You put a line through the headline and check the culvert.',
    meth: 'The stream is full of overlapping noises. The public notice is a quieter thing you can ask someone else to read with you.',
    mdma: 'The salmon is offering trust with conditions attached. It might be the most reasonable interview request you get all year.',
  },
  'WH-047': {
    sober:
      'A judging panel with eight scorecards should still have one set of published rules. The robes are not the hard part.',
    tipsy:
      'The octopus has found six ways to favor a friend and two ways to look innocent. Some of the human judges seem impressed.',
    stoned:
      'Every arm points somewhere else, yet all are attached to one animal. You wonder whether committees feel like this from inside.',
    tripping_balls:
      'The scorecards orbit the table like small moons. The spectators ask for a rubric, which returns gravity to the situation.',
    cocaine:
      'Eight scorecards, a deadline and no standard. You organize the objections by what can be decided before the prizes arrive.',
    meth: 'The wet ink makes it difficult to keep score. A volunteer offers a clean copy, and you are glad someone else has steady hands.',
    mdma: 'The crews all want recognition, but sharing a room does not mean sharing criteria. Fairness begins with letting them disagree.',
  },
  'WH-065': {
    sober:
      'The potluck rules are clear. The neighbor appears to believe private dinner guests owe him a constitutional amendment.',
    tipsy:
      'You came for a slice of pie and found a civil-liberties hearing in somebody’s driveway. The pie is making a strong argument.',
    stoned:
      'Everyone at the table sits where the trees hide them from the road. It is a good place to notice what privacy feels like.',
    tripping_balls:
      'Each guest seems to be wearing a very old forest as a coat. Nobody asks you to prove it, only to put your camera away.',
    cocaine:
      'The photographer wants an exclusive right now. You ask who agreed to be photographed, and the whole deadline changes shape.',
    meth: 'The flash and arguing are too much. You can take your dish inside and let the hosts speak for themselves.',
    mdma: 'You would love everyone to get along, but no one owes a stranger a photograph or an embrace. You ask where to put the pie.',
  },
  'WH-086': {
    sober:
      'An impossible corridor is still a fire-safety problem. Count the guests before you start speculating about architecture.',
    tipsy:
      'The manager insists all is well while coffee keeps returning to the same table. The server deserves a raise and an exit.',
    stoned:
      'Door after door opens onto the same scratched conference table. You focus on the chairs that people have actually left.',
    tripping_balls:
      'The corridor seems to fold into a conference agenda that has forgotten how to end. The EXIT sign remains reassuringly blunt.',
    cocaine:
      'Everyone wants a different door right now. You call for one headcount, one clear route and a pause on the keynote.',
    meth: 'The signs are multiplying and so is the noise. You ask a staffer to read the floor plan while you help with the headcount.',
    mdma: 'The server apologizes every time the coffee returns cold. You tell them they have done enough, then help everybody leave together.',
  },
  'WH-107': {
    sober:
      'The mayor is made of sand, but the protected plants are not. Start with the boundary on the actual habitat map.',
    tipsy:
      'A seashell toll is the smallest bureaucracy you have ever encountered. The dune volunteer has a larger and better point.',
    stoned:
      'The sandcastle has streets, citizens and a tiny public works crisis. Beyond it, the grasses have a less theatrical claim.',
    tripping_balls:
      'A capital city crumbles each time the sea takes a breath. The volunteer’s course tape is a much more durable constitution.',
    cocaine:
      'Race crew, mayor, volunteer: three urgent objections. You mark the protected patch first; the tariff can wait.',
    meth: 'There are too many overlapping instructions at the start line. You ask the volunteer to point out the safe course once more.',
    mdma: 'The tiny mayor wants dignity and the volunteer wants living dunes. Both wishes can survive a detour; neither requires applause.',
  },
}
