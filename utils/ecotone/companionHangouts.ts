import type { CompanionId, EncounterCard } from './content'

/**
 * Optional person-specific interludes after inviting a second guide to
 * travel together. Not part of the random quest deck: a mutual invitation
 * causes an opportunity, not an obligation, to spend time with that person.
 * No borrowed tribal history, romantic presumption, or free stat reward.
 */
export const COMPANION_HANGOUTS: Record<CompanionId, EncounterCard> = {
  kit: {
    id: 'CO-KIT-01',
    kind: 'encounter',
    chapter: 3,
    place: 'A borrowed Eureka workshop',
    title: 'The Wheel That Refuses Applause',
    scene: 'bay',
    body: [
      'Kit says she has forty minutes before the repair co-op closes. A wheel she built for a kinetic performance keeps spinning whenever nobody looks at it, and stops the moment anyone begins clapping. She puts the wheel on a workbench, then asks you to sit down rather than perform competence for her.',
      'A teenage apprentice wants to take it onstage tonight. The volunteer who signed off on the workshop says the wheel is unsafe, and Kit is angry because the volunteer is right. "I like applause," she admits, lowering her voice. "I also want these kids to keep their fingers."',
    ],
    leadLines: {
      mara: 'Mara asks who will own the design if somebody films it. Kit rolls her eyes, then fetches the workshop release forms.',
      juniper: 'Juniper studies the volunteer\'s stop sign on the machine. "The tree does not applaud when it falls," she says. Kit sighs. "Thank you, forest mother."',
      cedar: 'Cedar looks at the rim, not Kit. "The risk is in the hub." Kit looks relieved that someone noticed.',
    },
    choices: [
      {
        id: 'repair',
        label: 'Help her rebuild the wheel, and let the apprentice decide whether to ride it',
        cost: 'The show may start without her; no guarantee the repair holds',
        check: { skill: 'burly', target: 9 },
        success: {
          text: 'Together you strip the hub and find a worn spacer. The apprentice picks a slower, safer routine, and Kit performs beside them instead of taking the starring role. Afterward she admits that for once she liked the view from the sidelines.',
          effects: { goodwill: 1, flag: 'bond_kit_repair' },
        },
        failure: {
          text: 'The spacer cracks when you torque it. Kit loses her place in the show, the apprentice goes home disappointed, and nobody gets hurt. She is quiet all the way to the bus stop. "You stayed when there wasn\'t a trick left," she says, finally. The compliment is small and not entirely happy.',
          effects: { nerve: -1, flag: 'bond_kit_failed_repair' },
        },
      },
      {
        id: 'say-no',
        label: 'Back her up when she tells the apprentice this wheel will not go onstage',
        success: {
          text: 'The apprentice accuses Kit of giving up. She listens instead of arguing, then promises a supervised rebuild next month with no audience invited. At the workshop door she admits that saying no to a spectacle feels like stepping off a high wire without knowing where the ground is.',
          effects: { flag: 'bond_kit_boundary' },
        },
      },
      {
        id: 'give-space',
        label: 'Leave her the workbench and go find dinner for everyone',
        success: {
          text: 'You come back with takeout, extra napkins and no questions. Kit has taken the wheel apart herself. She thanks you for not turning her problem into a friendship test, and insists you keep the last dumpling.',
          effects: { flag: 'bond_kit_space' },
        },
      },
    ],
    provenance:
      'Fictional cooperative, machine, performer, apprentice and dialogue in a real Humboldt setting; no claim about a real workshop or race entry.',
  },
  juniper: {
    id: 'CO-JUNIPER-01',
    kind: 'encounter',
    chapter: 3,
    place: 'A storm drain beside the bay',
    title: 'A Tree Cannot Sign a Volunteer Sheet',
    scene: 'bay',
    body: [
      'Juniper has convinced the moss to grow through a neglected culvert. The moss does excellent work, and the resulting dam sends rainwater under the door of a neighboring repair shop. Its owner is standing there in rubber boots, holding an estimate nobody can pay.',
      '"I listened to the creek," Juniper says. The owner points to the water filling his shop. "Well, it did not listen to my lease." She asks you whether the right thing can still be wrong when it happens in the wrong place.',
    ],
    leadLines: {
      mara: 'Mara starts a clear list of actual losses, not a heroic speech. Juniper watches the water creep across the chalk lines.',
      kit: 'Kit offers to rig a temporary diversion from an old parade ramp. The shop owner will agree only if somebody checks it first.',
      cedar: 'Cedar shows the shop owner the drainage diagram. "There are two people who can approve this," he says. "Neither is a fern."',
    },
    choices: [
      {
        id: 'neighbors',
        label: 'Ask the shop owner and a drainage volunteer to choose a safer plan with Juniper',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'They move the moss to a nearby rain garden, agree on a maintenance roster, and reopen the workshop door. Juniper signs the roster in ink, very slowly. The owner insists on a phone number he can actually call if a tree starts another argument.',
          effects: { goodwill: 1, flag: 'bond_juniper_neighbors' },
        },
        failure: {
          text: 'Your impromptu meeting becomes an argument about who is liable for the flooded tools. Juniper helps carry the wet boxes upstairs. She is not forgiven, and her decision to return tomorrow feels harder than any magic.',
          effects: { nerve: -1, flag: 'bond_juniper_failed_neighbors' },
        },
      },
      {
        id: 'accountability',
        label: 'Tell Juniper that helping means repairing what she has already damaged',
        success: {
          text: 'She looks furious for one long breath. Then she takes off her boots, wades in and starts hauling the sodden stock out with the owner. "The creek and I can argue later," she says. They do, without you.',
          effects: { flag: 'bond_juniper_accountability' },
        },
      },
      {
        id: 'listen',
        label: 'Offer to listen tonight, without claiming to resolve the dispute',
        success: {
          text: 'Juniper talks for a while about watching the valley change without ever being asked what it needed. You listen, then ask whether the repair-shop owner might feel the same. She does not answer, but she writes his name down.',
          effects: { flag: 'bond_juniper_listened' },
        },
      },
    ],
    provenance:
      'The tidal drainage and repair shop dispute are fictional; no claim about a real property, drainage authority or supernatural intervention.',
  },
  cedar: {
    id: 'CO-CEDAR-01',
    kind: 'encounter',
    chapter: 3,
    place: 'An Eureka parking lot after dark',
    title: 'The Radio That Knows Your Father',
    scene: 'bay',
    body: [
      'Cedar\'s CB has begun picking up a man who sounds exactly like his father, arguing about a logging road that has not existed for twenty years. The voice gets the punchline of a family joke right but forgets the name of Cedar\'s mother. Cedar switches it off, waits, switches it on again.',
      'He tells you that his parents disagree about forests without turning every disagreement into a divorce. "I could ask Dad to come verify the voice," he says. "But that would make him responsible for this thing." For once the county\'s most useful repairman cannot find the right tool.',
    ],
    leadLines: {
      mara: 'Mara refuses to record the call without Cedar\'s permission. He looks grateful and annoyed that the question was necessary.',
      kit: 'Kit reaches for the radio dial, sees Cedar\'s face and stops. "Your call," she says, letting her hand fall.',
      juniper: 'Juniper listens to the engine tick as it cools. "A voice is not a person," she says. Cedar asks her to say it again.',
    },
    choices: [
      {
        id: 'verify',
        label: 'Check the signal against the call log before bringing anyone else into it',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'You find the original dispatch log from the night Cedar was born. The voice names a future road rather than an old one. Cedar photographs the evidence and waits until morning to decide whether his father needs to know.',
          effects: { evidence: 'Cedar\'s verified future radio call', flag: 'bond_cedar_verified' },
        },
        failure: {
          text: 'You mistake a repeater echo for a transmission and waste the last usable battery. Cedar does not offer false reassurance. He sits beside you on the curb and draws the actual radio path with a pen that keeps running out.',
          effects: { nerve: -1, flag: 'bond_cedar_failed_signal' },
        },
      },
      {
        id: 'respect',
        label: 'Tell Cedar that he gets to decide when his family is involved',
        success: {
          text: 'Cedar sets the radio between you, still switched off. "My folks worked hard to keep their arguments theirs," he says. He goes home for supper and invites you next week, provided you promise not to bring up the haunted electronics over dessert.',
          effects: { flag: 'bond_cedar_family_boundary' },
        },
      },
      {
        id: 'walk',
        label: 'Take a walk and talk about something other than machines or families',
        success: {
          text: 'He tells you about a truly dreadful sandwich he once made on a night shift. You retaliate with your own culinary embarrassment. When you get back, the radio is still quiet. Cedar decides that quiet does not need repairing.',
          effects: { flag: 'bond_cedar_walk' },
        },
      },
    ],
    provenance:
      'The CB call, road, family dialogue and named relationships are wholly fictional. No verified historical dispatch or family recording is represented.',
  },
  mara: {
    id: 'CO-MARA-01',
    kind: 'encounter',
    chapter: 3,
    place: 'A borrowed downtown art studio',
    title: 'The Bird With Someone Else’s Signature',
    scene: 'plaza',
    body: [
      'Mara has hung two sketches on the studio wall. Both show her six-winged bird. One is hers. The other appeared online yesterday under a stranger\'s name and has a line in the left wing she always erases. A would-be client offers to pay her to copy the counterfeit exactly.',
      '"I know I could do it better," she says. "That is not the same as wanting to." She waits for your answer, leaving the client\'s unanswered message on the table. The bird on the paper keeps its wings perfectly still.',
    ],
    leadLines: {
      kit: 'Kit offers to perform an elaborate public theft-of-credit sketch. Mara asks who would have to consent to be part of that show.',
      juniper: 'Juniper wants to tear up the copy. Mara asks, very gently, whether a damaged proof would help anyone.',
      cedar: 'Cedar proposes a timestamp ledger, then stops talking to ask what Mara actually wants documented.',
    },
    choices: [
      {
        id: 'papertrail',
        label: 'Help Mara document her earlier sketches before she challenges the credit',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'The studio archive has dated contact sheets, two witnesses and the erased line in Mara\'s own notebook. She assembles a complaint without making her clients into an audience. "It is good to have somebody who knows when to stop digging," she says.',
          effects: { evidence: 'Mara\'s dated original sketch record', flag: 'bond_mara_evidence' },
        },
        failure: {
          text: 'The cloud archive loses its timestamps mid-download. Mara has to ask an old colleague for help, and she is embarrassed that you witnessed it. She thanks you for staying, but does not pretend you solved anything.',
          effects: { nerve: -1, flag: 'bond_mara_failed_evidence' },
        },
      },
      {
        id: 'decline',
        label: 'Encourage her to turn down the commission even if the rent hurts',
        success: {
          text: 'Mara writes a courteous refusal that says exactly what it means. The client is furious, the rent is still due, and the original drawing goes back into her portfolio. She asks you to help her price the next commission fairly rather than promising exposure.',
          effects: { flag: 'bond_mara_refused_copy' },
        },
      },
      {
        id: 'space',
        label: 'Offer her the studio keys and leave the decision to her',
        success: {
          text: 'You lock up the supply cabinet and leave. Mara finds you an hour later with ink on her sleeves and no explanation owed. The next time she asks you into the studio, it is because she wants company.',
          effects: { flag: 'bond_mara_space' },
        },
      },
    ],
    provenance:
      'Fictional independent tattoo artist and artwork dispute. All sketches and studio conversations are invented; no real artist or client is implied.',
  },
}

/**
 * Only earned actions get a personalized memory in the finale. Repair failures
 * are remembered as failures with dignity, not transmuted into free successes.
 * These don't imply romance, change collectible ending IDs, or trigger ArtJobs.
 */
export const COMPANION_HANGOUT_CALLBACKS: Record<string, string> = {
  bond_kit_repair:
    'Kit kept that repaired hub above her workbench. When a new apprentice asked why it ran so slowly, she answered, "Because I wanted everybody to go home with all their fingers."',
  bond_kit_failed_repair:
    'Kit never forgot the night the show went on without her. She remembers you sitting beside the broken hub, too. The two facts remain separate.',
  bond_kit_boundary:
    'Kit taught the apprentice to say no onstage before she taught them to fall safely. The first lesson took longer.',
  bond_kit_space:
    'Kit still leaves one chair beside her bench for the friend who knows not every problem wants an audience.',
  bond_juniper_neighbors:
    'Juniper kept her promise to the repair-shop owner. Every August she checks the rain garden with the actual maintenance roster in her hand.',
  bond_juniper_failed_neighbors:
    'The flooded repair shop was not saved by one earnest meeting. Juniper came back the following morning with dry boxes and an apology she had to practice.',
  bond_juniper_accountability:
    'The shop owner eventually stopped keeping his sandbags beside the door. Juniper still helps sweep after storms, even when the creek insists it did nothing wrong.',
  bond_juniper_listened:
    'Juniper remembers someone who listened to the whole story, then asked about the person standing in the water. She tells that part now, too.',
  bond_cedar_verified:
    'Cedar filed the future call beside a handwritten note about what it could and could not prove. His parents read it only when he was ready to show them.',
  bond_cedar_failed_signal:
    'Cedar kept the dead battery as a reminder to verify the circuit before waking somebody else with bad news.',
  bond_cedar_family_boundary:
    'The next family supper had three arguments about trees and not a single interrogation about a ghost on the radio. Cedar considered it a victory.',
  bond_cedar_walk:
    'Sometimes Cedar leaves the radio off just to take a walk. He still tells a terrible sandwich story when the silence starts to feel too important.',
  bond_mara_evidence:
    'Mara still keeps the dated originals in an ordinary cabinet. Not because paper wins every dispute, but because the bird has a name and somebody was willing to check.',
  bond_mara_failed_evidence:
    'The missing timestamps cost Mara time and trust. She kept drawing anyway, and remembers who did not turn her lost archive into a cautionary poster.',
  bond_mara_refused_copy:
    'Mara lost that commission. She did not lose the right to decide what leaves her studio with her signature.',
  bond_mara_space:
    'Mara invites you to the studio sometimes, with no client crisis and no explanation beyond putting a second cup on the table.',
}

export function earnedCompanionHangoutCallbacks(
  flags: readonly string[],
): string[] {
  return [...new Set(flags)]
    .filter((flag) => Object.hasOwn(COMPANION_HANGOUT_CALLBACKS, flag))
    .map((flag) => COMPANION_HANGOUT_CALLBACKS[flag]!)
}
