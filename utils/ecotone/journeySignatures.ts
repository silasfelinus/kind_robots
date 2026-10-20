import type { Fate } from './content'

/**
 * Original sixteen companion/opening intersections, two earned fates each.
 * Never assume a specific fork, clue, promise, romantic relation or transfer.
 * The actual last companion and resolved civic future are established by the
 * run; these are emotional signatures, not forged play-history callbacks.
 */
export const REVISED_COMPANION_SIGNATURES: Record<
  string,
  Record<Fate, string>
> = {
  'mara.sober': {
    hope: 'You arrived looking for evidence that could stand up outside a story. With Mara, the question became who owned the evidence, the mark and the telling. She has a studio that can say no to imitation and yes to apprentices, and the town has a place where artists sign their own names. The strange bird is still strange; it no longer has to be stolen.',
    dark: 'You kept a careful account of everything that happened, and somehow the name that mattered most was left out. Mara can show you the date her design first appeared, the rejected invoice and the storefront that followed. Your records are accurate. Accuracy alone did not get her the room, the credit or the rent back.',
  },
  'mara.tipsy': {
    hope: 'What began as a noisy human connection settled into a durable coalition. Mara never needed another crowd telling her she was brilliant; she needed people who would pay, credit and defend the work once the music ended. The studio lights stay on because the friendships became contracts without becoming less like friendship.',
    dark: 'The night everyone celebrated Mara became the story people tell instead of the one where she was actually paid. A festival poster outlived the people who made it, and a sponsor learned to call that community. Mara has not stopped drawing, but the most popular image in town still belongs to everybody except its creator.',
  },
  'mara.stoned': {
    hope: 'At first every line seemed connected to every other line. Mara made you distinguish influence from appropriation, and a shared pattern from work someone must be credited for creating. Years later her apprentices teach that distinction before they learn to draw a wing, and the walls of the town are stranger and fairer for it.',
    dark: "You could see the six wings everywhere and mistook recurrence for consent. The motif traveled farther than its maker could, becoming the county logo before anyone asked Mara what she wanted. You learned that recognizing a connection is not the same as protecting a person's right to refuse it.",
  },
  'mara.tripping_balls': {
    hope: 'The first altered horizon suggested that art might change the future instead of merely illustrating it. Mara held onto the less glamorous part: signatures, apprenticeships, permission and a lease long enough to build something. When the impossible bird returns to a wall, the name beside it is legible, chosen and hers.',
    dark: 'A painted future seemed so bright that its ordinary costs were easy to omit. The mural survived, but the studio that designed it did not; another hand now traces the famous wings without remembering the person they came from. Mara knows exactly what happened. The county prefers the myth.',
  },
  'kit.sober': {
    hope: 'You started by asking how the gears worked. Kit asked a harder engineering question: who gets to build the next machine and who keeps the keys to the shop? The answer is a cooperative full of welded mistakes, paid teaching shifts and children who are allowed to try again. The impossible mechanism never quite got explained, but the workshop did.',
    dark: "The measurements were perfect and the ownership documents were not. Kit's invention made the sponsor's parade magnificent; the builders watched it from the wrong side of a fence. You can still explain the drive train, but you cannot explain why the people who repaired it were called expendable.",
  },
  'kit.tipsy': {
    hope: 'The first promise arrived with a cheer and someone reaching to catch someone else. Kit made that trust practical: safety ropes, shared tools, fair wages and a place to fail without becoming a joke. The troupe still knows how to make a crowd gasp, but the people under the costumes can afford to go home afterward.',
    dark: 'Everybody loved the spectacle, and the spectacle needed an audience more than it needed its builders. Kit learned to perform at events she could no longer help organize. There is still laughter when the giant contraptions pass, but she hears a cash register where the crowd once caught a falling performer.',
  },
  'kit.stoned': {
    hope: 'The ticking gear seemed to belong to a larger pattern, and Kit turned that instinct into something people could teach one another. Artists, mechanics and schoolchildren share a workshop whose rules are as inventive as its machines. You do not have to believe a gear is alive to believe its maker deserves credit.',
    dark: 'You watched one brilliant collaboration turn into a web of ownership nobody could untangle. Every sponsor claimed to be part of the same community, which somehow made nobody responsible for the people who built it. Kit keeps a little gear in her pocket; its rhythm no longer sounds like an invitation.',
  },
  'kit.tripping_balls': {
    hope: 'For a moment the impossible machinery looked less like an error than a new language. Kit translated the wonder into lessons, wages and open doors, never demanding that everyone see what you saw. There are now workshops where the strangest idea gets a fair test and the quietest apprentice gets a turn at the torch.',
    dark: "The future arrived as a spectacle so astonishing that the crowd forgot to ask who would maintain it. Kit's marvel became a billboard for a company that cannot mend a bicycle. You still remember the night the gears seemed to sing; she remembers the day the shop keys were taken away.",
  },
  'juniper.sober': {
    hope: "You trusted the measurements without asking them to explain away the strange. Juniper insisted that a living forest must include clear water, accountable stewards and neighbors who can still work beside it. The trails are open and the restoration plan has names, dates and a budget. The leaves in her reflection remain nobody's data point.",
    dark: 'Every part of the forest was surveyed, preserved and eventually fenced off. The documents were immaculate; the people who had cared for those places could no longer afford the gate. Juniper was never asking you to disbelieve the numbers. She was asking whose life the numbers were allowed to count.',
  },
  'juniper.tipsy': {
    hope: 'A temporary feeling of belonging became a forest meeting nobody had to be invited to twice. Juniper welcomed the joy but demanded the difficult follow-through: access, stewardship and livelihoods. Years later the neighbors still disagree in public and still meet under the same redwoods. That is a kind of magic she trusts.',
    dark: 'A good night of promises became a foundation plaque and a locked gate. Juniper waited for the people who had cheered to return with shovels, time or legal help. A few did. The forest still breathes, but the song no longer carries across the new fence.',
  },
  'juniper.stoned': {
    hope: "The forest's repeating rhythm first felt like a secret you alone could hear. Juniper showed you how many people already listened with their hands, livelihoods and careful observations. The work became shared rather than mystical property; the creek is healthier because nobody needed to be its sole interpreter.",
    dark: 'The sense of being connected was real, but it never became a way for neighbors to share responsibility. A beautiful protected patch grew isolated from the town that surrounded it. Juniper kept tending the edges, and you learned how easily reverence can leave a practical problem unanswered.',
  },
  'juniper.tripping_balls': {
    hope: 'You saw a forest with more futures than its roads allowed. Juniper did not ask you to pick the prettiest one. She asked for a future where paths stayed public, water ran clean and people who worked there could stay. It took negotiation and stubborn ordinary care to make the astonishing possibility inhabitable.',
    dark: 'The first vision promised a perfect grove with no footsteps in it. Years later the grove was just as undisturbed and far less alive with the community that once cared for it. Juniper never needed a flawless paradise; she needed someone willing to bear the untidy cost of protecting a shared one.',
  },
  'cedar.sober': {
    hope: "You took the radio voice as a claim that needed witnesses, then helped Cedar ask who should own the answer. The locally governed network now serves ridge homes, repair crews and creek stewards without turning anyone's backyard into a corporate laboratory. At Sunday dinner his parents are still arguing about trees and holding hands.",
    dark: 'You identified the anomalous signal correctly but missed the ordinary clause that sold its infrastructure away. Cedar can explain the towers down to the last bolt. His parents still argue lovingly over dinner, and the county they raised him in now pays rent to hear its own weather.',
  },
  'cedar.tipsy': {
    hope: 'A noisy pit-row friendship became a coalition of people who trusted one another enough to disagree about land and livelihood. Cedar got the network built without handing its switches to the highest bidder. His logger father and former Luna-support mother keep debating the same old tree; their marriage has outlasted another county argument.',
    dark: "The party celebrated a future network before anyone read the terms. The towers came, but the jobs moved away and the bills stayed. Cedar's parents are still together, feeding neighbors and arguing about the timber years; now they have another distant company to disagree about.",
  },
  'cedar.stoned': {
    hope: 'The strange transmission sounded like a county-wide conversation, and Cedar insisted conversations need two-way connections. The ridge network is locally answerable, the stream sensors belong to the people who maintain them, and nobody has to surrender a private life to report a damaged creek. His parents still hold hands through their arguments.',
    dark: 'Every sensor seemed connected, which made it easy for the vendor to claim all the connections. The county became beautifully legible to its absentee owner and harder for its own residents to speak in. Cedar keeps fixing receivers; his parents remain together, a home the towers cannot quite measure.',
  },
  'cedar.tripping_balls': {
    hope: 'For an instant you imagined a county that could hear every creek and every isolated neighbor. Cedar took the vision apart and rebuilt it with access rules, public ownership and people paid to maintain it. The bus runs, the sensors work, and at Sunday dinner his still-married parents argue over which compromise saved the watershed.',
    dark: 'The future sounded limitless when the voice first spoke, and the bargain seemed too grand to check. Cedar knows the network could have belonged to the people who use it. His parents still share a table and a home, still debating the trees; even their stubborn loyalty cannot recover a contract signed away.',
  },
}
