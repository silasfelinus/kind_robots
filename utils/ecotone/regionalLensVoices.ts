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
  'WH-008': {
    sober:
      'The stunt has no safety plan and the prop has refused. The stage manager can handle a strange actor; an injury would be harder.',
    tipsy:
      'The whole theater has taken the prop’s side, except the director. You wonder whether the fundraiser can survive a union meeting.',
    stoned:
      'The paper silhouette is looking more convincing than the prop that objects to being stabbed. Nobody is required to explain that.',
    tripping_balls:
      'The shadow on the curtain seems to have its own applause. The crew still needs an ordinary, reliable way to cut the lights.',
    cocaine:
      'Opening night, one impossible performer and an unsafe cue. You pick the cue that can actually be changed before the doors open.',
    meth:
      'The music and arguments are stacking up. You ask the stage manager to repeat the safety plan in the quiet of the wings.',
    mdma:
      'The prop wants a voice, the understudy wants to be safe, and the director wants a fundraiser. Listening is not the same as agreeing.',
  },
  'WH-033': {
    sober:
      'The caller at home answers the phone. The cliff is loose. Those are two useful facts you can hold without explaining the voice.',
    tipsy:
      'The cliff is doing impressions of your friends. You would rather the beach visitors not attend its next performance.',
    stoned:
      'A familiar voice travels through unfamiliar stone. You watch the gravel below it, where the danger is much less philosophical.',
    tripping_balls:
      'The rock appears to open its mouth and say your name. You listen from solid ground, and the mouth becomes a shadow again.',
    cocaine:
      'Someone is moving toward the drop and everybody wants an explanation. Getting them back takes priority over a perfect recording.',
    meth:
      'The echo repeats itself until it becomes hard to hear anything else. You ask a companion to watch the edge while you stand back.',
    mdma:
      'A loved voice can make a request feel intimate even from a cliff. You can care about the people here without obeying the sound.',
  },
  'WH-053': {
    sober:
      'You cannot find a safe external release on the hatch. The supposed research grant can be audited after the child is out of the craft.',
    tipsy:
      'The submarine looks like a three-person argument wrapped in sheet metal. The child has the only paperwork worth listening to.',
    stoned:
      'Bicycle pedals beneath the water would make a lovely story. You notice the bolts on the hatch that have not been tested.',
    tripping_balls:
      'The submarine is a small whale dreaming of becoming a bicycle. A pressure test brings the beautiful nonsense back to the dock.',
    cocaine:
      'A demonstration deadline, uncertain funding and a rising tide. You cancel the underwater portion before the checklist can multiply.',
    meth:
      'The crew has been awake too long. You invite them to stop the test, eat something and have a rested mechanic inspect the hatch.',
    mdma:
      'The makers love the machine, and the child loves being included. Safety can honor both without asking anyone to prove loyalty.',
  },
  'WH-076': {
    sober:
      'The odometer is steady and the sign is not. The passengers need their connections, not a compulsory roadside truth commission.',
    tipsy:
      'The bus has turned into an honesty contest nobody entered. The driver would prefer an accurate timetable to everybody’s secrets.',
    stoned:
      'A half mile seems to stretch and shrink beyond the windshield. The landmarks by the road are staying stubbornly where they belong.',
    tripping_balls:
      'Each lie makes the sign drift like a thought that cannot find the right word. The bus still has wheels and several destinations.',
    cocaine:
      'Every passenger has a theory and somebody’s connection is closing. You organize the calls instead of racing the mile marker.',
    meth:
      'The arguments have gone on for miles. You ask the driver for the next known stop and let the other riders lower their voices.',
    mdma:
      'The passengers are frightened of being blamed for the detour. You can help them get home without demanding a confession.',
  },
  'WH-095': {
    sober:
      'The scar changes with the light, and the family has not asked to become part of a forest mystery. A private sketch is enough.',
    tipsy:
      'The bark has invented a new relative. You suspect the family would prefer to hear about it before the camera club does.',
    stoned:
      'The redwood holds centuries of damage in one curve. The resemblance appears, disappears and refuses to provide a family name.',
    tripping_balls:
      'The bark seems to wear a whole household like a passing expression. The wind moves; the tree has no further statement.',
    cocaine:
      'You could send the photograph before the sun shifts. You hold the phone and decide a deadline is not permission.',
    meth:
      'The faces seem clearer each time you look, then suddenly not. You mark where you stood and ask someone else to compare the sketch.',
    mdma:
      'The family’s privacy matters more than sharing a beautiful coincidence. You let them choose whether it becomes their story.',
  },
  'WH-115': {
    sober:
      'Six ballots promise six futures, but none records everybody affected. Start with the crews whose work has disappeared from the tally.',
    tipsy:
      'The officials have managed to turn an awards ceremony into a referendum on reality. The missing teams did not even get an invitation.',
    stoned:
      'Each ballot is a different memory of the same race. You notice how easily a crowd can applaud while somebody vanishes from the list.',
    tripping_balls:
      'The county seems to split into six small paper counties. On the folding table, the sign-in sheet remains stubbornly singular.',
    cocaine:
      'There is pressure to decide now, before anyone asks inconvenient questions. You insist on the witness list before the countdown.',
    meth:
      'The votes and names blur together under the lights. You ask the clerk to read the six proposals slowly and keep a written copy.',
    mdma:
      'You want every crew to see itself in the future. That cannot happen until they can say what each future costs them.',
  },
}
