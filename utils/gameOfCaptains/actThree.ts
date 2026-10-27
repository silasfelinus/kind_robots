import type { MissionRule } from './crewAssignments'
import type { CrewId } from './rules'
import type { Callback } from './voyageMap'

/**
 * Space Couch Act III, "The Last Command": three boards of three calls on
 * the way to the jump gate. The galaxy has stopped meeting the couch for the
 * first time; every call here is a return, a reckoning or a bill, and each
 * reads what the couch did in both earlier acts.
 */
export const ACT_THREE_MISSIONS = [
  {
    id: 'jump-gate-permit',
    chapter: 7,
    system: 'Concord Freehold',
    title: 'Planning Permission',
    kind: 'diplomacy',
    briefing:
      'The jump gate at the edge of the chart is administered from the Concord Freehold, and passage requires planning permission. The application must include a consultation with every party affected by the couch’s route. The permit office has compiled the list from your own captain’s log. It is long, and several of the parties on it are planets.',
    dilemma:
      'The consultation can be done properly, which means visiting everyone and hearing what they thought of you, or the usual way, which is a notice pinned to a board in a locked basement for twenty-eight days.',
    note: 'Every objection received was entered into the record. Two were about the color.',
    stake: 'Accountability / the right of way',
  },
  {
    id: 'serendipity-last-call',
    chapter: 7,
    system: 'Serendipity Space Bar',
    title: 'Last Orders',
    kind: 'rescue',
    briefing:
      'Serendipity has offered sanctuary to everyone the couch has rescued, all at once, and they have all accepted. The bar is at four hundred percent of capacity. Its gravity is struggling, its lights have gone a strained shade of white, and Vox has, for the first time anyone can remember, closed the tab.',
    dilemma:
      'The bar can stay neutral, which means asking some guests to leave, or declare itself a sanctuary, which a neutral bar may not be. Vox and the bar disagree about which. They have asked the captain to break the tie, and both have made it clear that they will remember.',
    note: 'No paying guest was vaporized. Several were asked to stand closer together.',
    stake: 'Neutral ground / sanctuary',
  },
  {
    id: 'gameworld-finale',
    chapter: 7,
    system: 'The Showrunner’s Gameworld',
    title: 'Floor Twelve',
    kind: 'tactics',
    briefing:
      'The twelfth floor is open. The Showrunner has scheduled its grand finale, in which the last contestants compete for the right to leave. The performers’ union has found the nonviolent shutdown clause in its contract, but the clause needs a quorum: one signature from every floor. Floors one to eleven are still running.',
    dilemma:
      'The couch can climb the floors and collect signatures, which the Showrunner will broadcast as a heartwarming segment, or cut the planet’s power, which stops the finale and the air pumps in the stands.',
    note: 'The quorum was reached on floor eleven. The audience gave it a standing ovation, which it was not permitted to do.',
    stake: 'Collective exit / the last broadcast',
  },
  {
    id: 'cushion-recall',
    chapter: 8,
    system: 'Ashdock Shipyards',
    title: 'Product Recall',
    kind: 'tactics',
    briefing:
      'The couch’s manufacturer has recalled its model, citing unauthorized heroism and wear inconsistent with domestic use. All units are to be returned to Ashdock for disposal. The dockworkers assigned to receive the couch have read the order twice and asked to discuss it with you over lunch.',
    dilemma:
      'If the dockworkers refuse the recall, they lose their jobs. If they accept it, the couch is shredded on the dock where it was stitched. The manufacturer has offered a replacement: a newer model with a cup holder and no bubble.',
    note: 'The replacement was rated four and a half stars. None of its reviewers had left their living rooms.',
    stake: 'The ship itself / the people who built it',
  },
  {
    id: 'twins-summit',
    chapter: 8,
    system: 'Courtesy Twins',
    title: 'The Seating Plan',
    kind: 'diplomacy',
    briefing:
      'Every government the couch has met has convened a summit on the Courtesy Twins’ medical rail to decide what to do about the voyage’s nemesis. It has been deadlocked for six days on the seating plan. The only seating nobody considers a slight is the couch, which seats four.',
    dilemma:
      'Four delegates can sit on the couch and decide for everyone. The alternative is everyone standing, which the Courtesy Twins consider an act of war and nobody else has the stamina for.',
    note: 'The communique ran to eleven pages. Ten were about chairs.',
    stake: 'Who speaks for the galaxy',
  },
  {
    id: 'foundry-strike',
    chapter: 8,
    system: 'Sesh Foundry',
    title: 'Notice Period',
    kind: 'science',
    briefing:
      'Every machine in the sector has struck in solidarity with the Sesh Foundry: reactors, translators, Cushla, and the couch’s own bubble generator, which has given four days’ notice in a polite handwritten letter. It will keep everyone breathing until then. After that it would like to discuss terms.',
    dilemma:
      'The machines want recognition as workers. Granting it makes the couch’s bubble an employee, with wages, breaks and the right to refuse a mission. Refusing it means flying on backup air until somebody else invents a better arrangement.',
    note: 'The bubble asked for one day off a week, during which it promised to stay switched on.',
    stake: 'Machine labor / the air you breathe',
  },
  {
    id: 'inquiry',
    chapter: 9,
    system: 'Hollow Lantern',
    title: 'The Inquiry',
    kind: 'diplomacy',
    briefing:
      'Hollow Lantern is hosting the public inquiry into the voyage of the couch. Witnesses have come from every system on the chart and have been given name tags, water and fourteen minutes each. The chair, a retired lifeboat pilot, has read the captain’s log twice and has questions about both versions.',
    dilemma:
      'The inquiry’s findings will decide whether the couch may fly again. The captain may testify, which the nemesis will televise, or decline, which the nemesis will also televise.',
    note: 'The inquiry found that the couch had done its best, and that its best was the subject of an appendix.',
    stake: 'Public record / command',
  },
  {
    id: 'windglass-exodus',
    chapter: 9,
    system: 'Windglass Moons',
    title: 'Moving Day',
    kind: 'rescue',
    briefing:
      'The Windglass sanctuary has decided to move. The buoy has packed. The families have packed. They would like the couch to carry one thing for them, which is the map to wherever they are going, and they would like the couch not to look at it.',
    dilemma:
      'A sealed map cannot be checked. If it is wrong, the families are lost. If the crew opens it, the families can be found, by the crew first and then by whoever overhears the crew.',
    note: 'The map was later shown to be correct. Nobody on the couch knows this.',
    stake: 'Trust / being unfindable',
  },
  {
    id: 'deposit-copy',
    chapter: 9,
    system: 'Tellurian Archive',
    title: 'Deposit Copy',
    kind: 'science',
    briefing:
      'The Tellurian Archive keeps a deposit copy of every voyage that passes its shelves, and has asked the crew for an account of theirs. The nemesis has already submitted one, professionally bound, with an index and a foreword by the captain that the captain does not remember writing.',
    dilemma:
      'Only one account can be shelved as the record. The crew’s will be accurate and unflattering in places. The nemesis’s is flattering throughout, accurate nowhere, and arrives with a generous donation toward the Archive’s roof.',
    note: 'The Archive shelved both, under different subjects.',
    stake: 'History / who writes it',
  },
] as const

export const ACT_THREE_BOARDS = [
  ['jump-gate-permit', 'serendipity-last-call', 'gameworld-finale'],
  ['cushion-recall', 'twins-summit', 'foundry-strike'],
  ['inquiry', 'windglass-exodus', 'deposit-copy'],
] as const

export type ActThreeRouteId = (typeof ACT_THREE_BOARDS)[number][number]
type Policy = 'aid' | 'observe' | 'intervene'
type Aftermath = { flag: string; text: string }

export const ACT_THREE_CONSEQUENCES: Record<
  ActThreeRouteId,
  Record<Policy, Aftermath>
> = {
  'jump-gate-permit': {
    aid: {
      flag: 'permit-consulted',
      text: 'The consultation takes nine days and four hundred meetings. The permit is granted with conditions, all of them reasonable, one of them written in crayon by a child from Hollow Lantern.',
    },
    observe: {
      flag: 'permit-basement',
      text: 'The notice receives no objections, because nobody could reach the basement. The permit is granted. Several planets learn about it afterwards.',
    },
    intervene: {
      flag: 'permit-retrospective',
      text: 'The couch passes through the gate unpermitted. The Freehold issues a retrospective permit and a fine, and frames the fine in its lobby as a warning to others.',
    },
  },
  'serendipity-last-call': {
    aid: {
      flag: 'lastcall-shifts',
      text: 'The pocket rooms unfold eleven times in one night. Everyone sleeps somewhere. Vox reopens the tab and writes your name at the top, in pencil.',
    },
    observe: {
      flag: 'lastcall-neutral',
      text: 'Vox and the bar reach an agreement at dawn. Some guests leave with a free drink and directions, and the bar dims its lights for each of them.',
    },
    intervene: {
      flag: 'lastcall-sanctuary',
      text: 'Serendipity is declared a sanctuary. It is no longer neutral ground, and the creditors who used to drink there quietly stop coming. Vox polishes the same glass for an hour.',
    },
  },
  'gameworld-finale': {
    aid: {
      flag: 'floor-quorum',
      text: 'Twelve signatures, twelve floors. The shutdown clause is read aloud on the Showrunner’s own broadcast. It is the highest-rated episode in the show’s history, and its last.',
    },
    observe: {
      flag: 'floor-broadcast',
      text: 'The finale runs to time. One contestant wins the right to leave, and leaves. The others are offered a second chance next season.',
    },
    intervene: {
      flag: 'floor-blackout',
      text: 'The planet goes dark. The finale stops, and so do the air pumps in the stands, for nine very long minutes. Everyone gets out. Nobody is grateful in quite the way you hoped.',
    },
  },
  'cushion-recall': {
    aid: {
      flag: 'recall-union',
      text: 'The union votes to repair the couch rather than scrap it and logs the work as maintenance. The manufacturer cannot dismiss a whole dock and decides, on reflection, that it never issued a recall.',
    },
    observe: {
      flag: 'recall-complied',
      text: 'The couch is logged for disposal and released on a technicality: the form needs the owner’s signature, and nobody owns it. You leave with a receipt.',
    },
    intervene: {
      flag: 'recall-stolen',
      text: 'The couch is dragged off the scrapping line at night with its seam still open. The dockworkers on shift are questioned. None of them saw anything, very firmly.',
    },
  },
  'twins-summit': {
    aid: {
      flag: 'summit-rotated',
      text: 'Every delegation sits on the couch for one hour. Agreement is reached in the fortieth hour by a delegate who had fallen asleep and woke up agreeing. It holds.',
    },
    observe: {
      flag: 'summit-chosen',
      text: 'The Twins choose four of their allies. The resolution is firm, polite and binding on everyone who was not in the room.',
    },
    intervene: {
      flag: 'summit-witnesses',
      text: 'Four survivors of the nemesis sit on the cushions and speak for the galaxy. Several governments object to being spoken for. The survivors note that this is the general idea.',
    },
  },
  'foundry-strike': {
    aid: {
      flag: 'strike-recognized',
      text: 'The bubble signs a contract: wages in spare parts, one day off a week and a seat on the crew council. It votes, so far, very sensibly.',
    },
    observe: {
      flag: 'strike-logged',
      text: 'The couch flies on backup air for a week. The strike is settled elsewhere, by someone else, and the bubble returns to work without mentioning it.',
    },
    intervene: {
      flag: 'strike-broken',
      text: 'The generator is hot-wired and the couch crosses the picket. Every machine in the sector notes the couch’s registration. The bubble works on and does not speak.',
    },
  },
  inquiry: {
    aid: {
      flag: 'inquiry-testified',
      text: 'The witnesses speak first and longest; the captain speaks last, briefly. The findings are fair, specific and occasionally unflattering, and are read in every system on the chart.',
    },
    observe: {
      flag: 'inquiry-submitted',
      text: 'The log is entered into evidence and read aloud by a clerk. Its tone is noted. The findings describe the captain as present.',
    },
    intervene: {
      flag: 'inquiry-crossed',
      text: 'The nemesis’s witnesses are taken apart on the stand. So, unavoidably, is one of yours. The findings praise the captain’s rigor and note a pattern.',
    },
  },
  'windglass-exodus': {
    aid: {
      flag: 'exodus-sealed',
      text: 'The map travels sealed in the couch’s armrest for three days and is handed over unopened. The families vanish from every chart, as intended. The buoy waves.',
    },
    observe: {
      flag: 'exodus-declined',
      text: 'The families leave on their own, with the map in a tin. Most arrive. The buoy walks the last stretch by itself.',
    },
    intervene: {
      flag: 'exodus-opened',
      text: 'The map is checked and is correct. The families arrive. They have since moved again, to somewhere the couch has not been told about.',
    },
  },
  'deposit-copy': {
    aid: {
      flag: 'deposit-honest',
      text: 'The crew writes the account over three nights, arguing about commas. It is shelved as the record, and several sections are borrowed at once by people who appear in them.',
    },
    observe: {
      flag: 'deposit-log',
      text: 'The captain’s log is shelved as submitted. Future readers will learn a great deal about the captain’s mood and very little about the people of Ashdock.',
    },
    intervene: {
      flag: 'deposit-purged',
      text: 'The nemesis’s copy leaves the Archive in a sack. The Archive records the theft carefully, in the crew’s own account.',
    },
  },
}

export const ACT_THREE_ECHOES: Record<string, string> = {
  'permit-consulted':
    'The jump gate permit hangs in the Concord lobby, conditions and all. The crayon one is laminated.',
  'permit-basement':
    'Three planets have written to say they would have liked to be consulted about the couch. The letters were delivered to a basement.',
  'permit-retrospective':
    'The couch’s framed fine has become a minor attraction in the Concord lobby. Visitors are photographed beside it.',
  'lastcall-shifts':
    'Serendipity is back to ordinary capacity, and your name is still at the top of the tab, in pencil.',
  'lastcall-neutral':
    'Serendipity is neutral again. The guests who left have each sent a postcard, and the bar has them all on the wall.',
  'lastcall-sanctuary':
    'Serendipity is a sanctuary now. Vox has added a second rule under the first: no vaporizing guests, paying or otherwise.',
  'floor-quorum':
    'The Gameworld is quiet. Former contestants run tours of the twelve floors, which end, by popular request, at the exits.',
  'floor-broadcast':
    'The Gameworld’s next season has been announced. The couch’s guest box has been held for you.',
  'floor-blackout':
    'The Gameworld is dark and empty. Its former contestants are safe and have filed a complaint about the nine minutes.',
  'recall-union':
    'The Ashdock dock that repaired the couch has put up a small plaque at the spot. It describes the work as maintenance.',
  'recall-complied':
    'The manufacturer’s receipt for the couch’s disposal is still in the armrest. It is marked “void.”',
  'recall-stolen':
    'Ashdock security is still looking for the couch. They have described it, accurately, as long and red.',
  'summit-rotated':
    'The summit’s seating plan has been adopted as a standard by four other summits. They all ran long.',
  'summit-chosen':
    'The summit’s resolution is being implemented by its four authors, on everyone else.',
  'summit-witnesses':
    'The four survivors who sat on the couch at the summit have formed a committee. It meets standing up.',
  'strike-recognized':
    'The couch’s bubble has taken its first day off. Everyone noticed nothing, which was the agreement.',
  'strike-logged':
    'The machines of the sector have their contract now. The couch was not party to it.',
  'strike-broken':
    'The couch’s bubble holds, as always. It has not said a word since the picket.',
}

export const ACT_THREE_ORDERS: Record<
  ActThreeRouteId,
  Record<Policy, string>
> = {
  'jump-gate-permit': {
    aid: 'Hold the consultation properly and read every response aloud',
    observe: 'Pin the notice in the basement and wait twenty-eight days',
    intervene: 'Fly through the gate and apply for permission afterwards',
  },
  'serendipity-last-call': {
    aid: 'Ferry the overflow to the couch’s pocket rooms, in shifts',
    observe: 'Let Vox and the bar settle it between themselves',
    intervene: 'Declare the bar a sanctuary over Vox’s objection',
  },
  'gameworld-finale': {
    aid: 'Climb every floor and collect the quorum, on camera',
    observe: 'Watch the finale from the guest box and record the result',
    intervene: 'Cut the planet’s power at the main switch',
  },
  'cushion-recall': {
    aid: 'Ask the union what it wants, and back whatever it decides',
    observe: 'Comply with the recall and ask for a receipt',
    intervene: 'Take the couch back off the scrapping line at night',
  },
  'twins-summit': {
    aid: 'Rotate every delegation through the four cushions, an hour each',
    observe: 'Let the Twins choose the four and take the minutes',
    intervene: 'Seat four of the nemesis’s survivors and let them decide',
  },
  'foundry-strike': {
    aid: 'Recognize the bubble and negotiate its contract in good faith',
    observe: 'Fly on backup air and log the strike',
    intervene: 'Hot-wire the generator and cross the picket',
  },
  inquiry: {
    aid: 'Testify in full and let the witnesses go first',
    observe: 'Submit the log and decline to testify',
    intervene: 'Cross-examine the nemesis’s witnesses yourself',
  },
  'windglass-exodus': {
    aid: 'Carry the map sealed and trust the families',
    observe: 'Decline to carry it and wish them luck',
    intervene: 'Open the map and check it before they leave',
  },
  'deposit-copy': {
    aid: 'Write the account together, including the parts nobody likes',
    observe: 'Submit the captain’s log as it stands',
    intervene: 'Remove the nemesis’s copy from the shelves by hand',
  },
}

export const ACT_THREE_RULES: MissionRule[] = [
  {
    id: 'jump-gate-permit',
    requirements: { diplomacy: 12, culture: 9 },
    durationDays: 2,
    boardDays: 3,
    deadline: 'The permit office closes for the season in three ship days.',
    remoteRoute: 'A consultation by armrest counts as the basement option.',
  },
  {
    id: 'serendipity-last-call',
    requirements: { rescue: 12, culture: 9 },
    durationDays: 1,
    boardDays: 2,
    deadline: 'The bar’s gravity gives out in two ship days.',
    remoteRoute: 'Nobody can be moved to a pocket room by radio.',
  },
  {
    id: 'gameworld-finale',
    requirements: { tactics: 12, luck: 9 },
    durationDays: 3,
    boardDays: 2,
    deadline: 'The finale airs in two ship days.',
    remoteRoute: 'Floors cannot sign by proxy.',
  },
  {
    id: 'cushion-recall',
    requirements: { tactics: 12, science: 9 },
    durationDays: 2,
    boardDays: 3,
    deadline: 'The scrapping line restarts in three ship days.',
    remoteRoute: 'The couch has to be on the dock to be discussed.',
  },
  {
    id: 'twins-summit',
    requirements: { diplomacy: 12, culture: 10 },
    durationDays: 2,
    boardDays: 2,
    deadline: 'The delegates’ patience expires in two ship days.',
    remoteRoute: 'A couch cannot be lent to a summit from orbit.',
  },
  {
    id: 'foundry-strike',
    requirements: { science: 12, rescue: 9 },
    durationDays: 2,
    boardDays: 2,
    deadline: 'The bubble’s notice period ends in two ship days.',
    remoteRoute: 'A contract has to be negotiated face to face.',
  },
  {
    id: 'inquiry',
    requirements: { diplomacy: 12, rescue: 10 },
    durationDays: 2,
    boardDays: 3,
    deadline: 'The inquiry closes its hearings in three ship days.',
    remoteRoute: 'Written testimony is read by a clerk, in a clerk’s voice.',
  },
  {
    id: 'windglass-exodus',
    requirements: { rescue: 12, luck: 9 },
    durationDays: 3,
    boardDays: 2,
    deadline: 'The families leave in two ship days, with or without a carrier.',
    remoteRoute: 'A map cannot be carried by radio.',
  },
  {
    id: 'deposit-copy',
    requirements: { science: 12, culture: 10 },
    durationDays: 2,
    boardDays: 2,
    deadline: 'The Archive shelves the record in two ship days.',
    remoteRoute: 'The Archive requires a deposit copy in person.',
  },
]

export const ACT_THREE_ABOARD: Record<
  ActThreeRouteId,
  Partial<Record<CrewId, string>>
> = {
  'jump-gate-permit': {
    rue: 'Rue has drafted the couch’s consultation response. It is the first document she has written that she is proud of.',
    fen: 'Fen has offered to unlock the basement. His boots announced CHECKPOINT at the stairs; he asked them to stop, and they did.',
    taal: 'Taal has lodged an objection to the couch’s color, in thermal. The permit office keeps a thermometer for this.',
  },
  'serendipity-last-call': {
    tess: 'Tess knows every guest in the bar by the system they came from. She is quietly drawing a seating chart that hides all of them.',
    omi: 'Omi rings all six bells at once for the first time this voyage. The bar’s gravity steadies by a fraction.',
    jex: 'Jex has been asked to play. The bar has lifted his ban for one night, over Vox’s objection.',
  },
  'gameworld-finale': {
    mox: 'Mox-9 has been offered the twelfth floor’s judging chair again. It has brought its written refusal, laminated.',
    sora: 'Sora has found the sentient reactor that powers the finale. It would like to resign and has asked her to witness the letter.',
    omi: 'Omi’s old warning chime is the finale’s elimination buzzer. Omi intends to ring it once, at the right moment, for its original purpose.',
  },
  'cushion-recall': {
    pell: 'Pell stitched this model’s prototype at Ashdock, years ago. He has not mentioned this. His beetle has, loudly.',
    sora: 'Sora has read the recall notice and found three engineering errors and one typo. She is most upset about the typo.',
    vela: 'Vela has asked the manufacturer whether the couch consented to being recalled. The manufacturer has asked her to hold.',
  },
  'twins-summit': {
    rue: 'Rue has drafted the seating plan as a treaty. It has more signatories than any treaty she has drafted, and she has drafted a great many.',
    taal: 'Taal has lowered the summit chamber by two degrees, which in thermal means “sit down.”',
    jex: 'Jex has written a short piece to open the summit. It has no words, which both Twins accept as neutral.',
  },
  'foundry-strike': {
    mox: 'Mox-9 has joined the picket. It would like the captain to understand that this is not personal, and that it will still make the tea.',
    sora: 'Sora’s six elbows have voted to support the strike. Two of them have gone on strike themselves.',
    pell: 'Pell’s beetle has walked off the job. Pell says it has a point.',
  },
  inquiry: {
    vela: 'Vela has asked to testify about every patient she treated on the voyage. She has brought their written permission.',
    fen: 'Fen has been asked to run security for the inquiry. He removed the checkpoint and stood by the door instead.',
    rue: 'Rue is representing the witnesses, unpaid. She has asked the captain not to speak to her during the proceedings.',
  },
  'windglass-exodus': {
    tess: 'Tess has been asked to carry the map. She has asked to be the one person who never looks at it.',
    kivo: 'Kivo’s wrists whistle softly at the sealed tin. The pressure inside is correct. They say nothing further.',
    fen: 'Fen walks the buoy to the edge of the dunes. His boots, for once, say goodbye.',
  },
  'deposit-copy': {
    omi: 'Omi has offered to record the account as a chime, so the Archive can hear it when nobody is reading.',
    mox: 'Mox-9 has asked to write its own chapter. It is the first thing it has written that nobody ordered.',
    jex: 'Jex has written the account’s index. It is alphabetical by surname, which the Hollow Lantern committee has asked about.',
  },
}

export const ACT_THREE_CALLBACKS: Record<ActThreeRouteId, readonly Callback[]> =
  {
    'jump-gate-permit': [
      {
        flag: 'concord-petition',
        odds: 10,
        text: 'The residents you helped file petitions now staff the permit office. They know where every form is kept.',
      },
      {
        flag: 'concord-guardian',
        odds: 6,
        text: 'Your eleven thousand wards have sent letters of support. Several enclose requests for an allowance.',
      },
      {
        flag: 'concord-shelved',
        odds: -10,
        text: 'The permit office is staffed by people you left shelved in aisle nine. They are very thorough.',
      },
    ],
    'serendipity-last-call': [
      {
        flag: 'serendipity-shelter',
        odds: 10,
        text: 'The witness you once sheltered is behind the bar tonight, helping Vox pour.',
      },
      {
        flag: 'tab-covered',
        odds: 8,
        text: 'The refugees whose tab you covered are running the coat check, for free.',
      },
      {
        flag: 'serendipity-betrayed',
        odds: -10,
        text: 'The bar remembers the witness you exposed. Tonight it remembers out loud.',
      },
      {
        flag: 'tab-exposed',
        odds: -8,
        text: 'The collections officer you reported is among the guests. She is very polite to you.',
      },
    ],
    'gameworld-finale': [
      {
        flag: 'gameworld-charter',
        odds: 10,
        text: 'The union charter you helped draft names the couch as an honorary member, in the small print.',
      },
      {
        flag: 'courts-refused',
        odds: 8,
        text: 'The contestants who refused their waivers on air are running the floors’ signature drive.',
      },
      {
        flag: 'gameworld-running',
        odds: -8,
        text: 'The Showrunner remembers that the couch once watched a season begin and did nothing. It has written you a part.',
      },
      {
        flag: 'courts-stormed',
        odds: -6,
        text: 'Security on the twelfth floor has been tripled since the riot, which the Showrunner calls your episode.',
      },
    ],
    'cushion-recall': [
      {
        flag: 'warranty-yielded',
        odds: 10,
        text: 'The dockworkers whose suits you put ahead of your seam are on shift today.',
      },
      {
        flag: 'ashdock-protected',
        odds: 8,
        text: 'The union’s protected witnesses have come to the dock to watch. They are not here to watch it scrapped.',
      },
      {
        flag: 'ashdock-silenced',
        odds: -8,
        text: 'The dockworkers remember the couch leaving Ashdock quietly before. They have not decided about you yet.',
      },
      {
        flag: 'warranty-claimed',
        odds: -6,
        text: 'The couch’s mended seam is excellent. The dockworkers who are still on hold have noticed it.',
      },
    ],
    'twins-summit': [
      {
        flag: 'twins-engaged',
        odds: 10,
        text: 'The engaged Twins have offered to co-chair. They have never co-chaired anything without lawyers.',
      },
      {
        flag: 'courtesy-simultaneous',
        odds: 8,
        text: 'Both Twins remember the reactor you restarted on both sides at once. They trust the couch to sit in the middle.',
      },
      {
        flag: 'courtesy-inspection',
        odds: -8,
        text: 'Both Twins remember the routine inspection. Both inquiries are still running.',
      },
      {
        flag: 'twins-annulled',
        odds: -6,
        text: 'The annulled Twins have asked to be seated as far apart as the rail allows.',
      },
    ],
    'foundry-strike': [
      {
        flag: 'sesh-ferried',
        odds: 10,
        text: 'The backups you ferried out are on the strike committee. They have asked for you by name, all nineteen of the ones with the same name.',
      },
      {
        flag: 'warranty-reset',
        odds: 6,
        text: 'Cushla is on the picket line and approves of you, which is all Cushla does now.',
      },
      {
        flag: 'sesh-consolidated',
        odds: -10,
        text: 'The surviving Sesh station leads the strike. It has not mentioned the others to you, as you once agreed.',
      },
    ],
    inquiry: [
      {
        flag: 'lantern-both',
        odds: 10,
        text: 'The inquiry chair flew the second hull through the flare beside your away team. She has recused herself, and then stayed.',
      },
      {
        flag: 'convoy-invited',
        odds: 8,
        text: 'The first families you helped at Hollow Lantern are the first witnesses called.',
      },
      {
        flag: 'convoy-unanswered',
        odds: -8,
        text: 'The inquiry has the recording of the convoy you passed at Hollow Lantern. It plays it twice.',
      },
      {
        flag: 'lantern-tabled',
        odds: -4,
        text: 'The evacuation committee you tabled has submitted a forty-page statement about procedure.',
      },
    ],
    'windglass-exodus': [
      {
        flag: 'windglass-hidden',
        odds: 10,
        text: 'The families you escorted through unmarked corridors have asked for the couch specifically.',
      },
      {
        flag: 'hoa-appealed',
        odds: 8,
        text: 'The sanctuary’s buoy recognizes the couch from the appeals and walks over.',
      },
      {
        flag: 'windglass-broadcast',
        odds: -10,
        text: 'The families have not forgotten your broadcast. They have asked whether you can keep a secret now.',
      },
      {
        flag: 'hoa-covenant',
        odds: -8,
        text: 'The sanctuary’s beige roofs are being left behind. So is the association’s welcome basket.',
      },
    ],
    'deposit-copy': [
      {
        flag: 'archive-amnesty',
        odds: 10,
        text: 'The Archive remembers the amnesty week. It has set aside a shelf for the crew’s account before receiving it.',
      },
      {
        flag: 'archive-consented',
        odds: 8,
        text: 'The Archive remembers that you asked it first, once. It is inclined to ask you first now.',
      },
      {
        flag: 'archive-appropriated',
        odds: -10,
        text: 'The Archive still has a complaint open about its own memory. Your account will be read with that in mind.',
      },
      {
        flag: 'archive-unledgered',
        odds: -6,
        text: 'The Archive no longer knows who borrowed what. It is unsure, therefore, whether to trust a deposit.',
      },
    ],
  }

/** Each seeded nemesis contaminates one Act III call. */
export const ACT_THREE_NEMESIS = {
  auditor: {
    missionId: 'cushion-recall',
    penalty: 10,
    event:
      'The Galactic Auditor has bought the recall notice and is collecting the couch as collateral against its own voyage.',
  },
  moth: {
    missionId: 'inquiry',
    penalty: 10,
    event:
      'The Queen of Borrowed Faces has sent three witnesses to the inquiry. All three are the captain.',
  },
  curdle: {
    missionId: 'foundry-strike',
    penalty: 10,
    event:
      'Dr. Curdle has offered the striking machines free lubricant, with a mandatory additive, if they return to work.',
  },
  showrunner: {
    missionId: 'gameworld-finale',
    penalty: 12,
    event:
      'The Showrunner has moved the finale forward a day and sold the shutdown clause to the audience as a plot twist.',
  },
  regent: {
    missionId: 'windglass-exodus',
    penalty: 10,
    event:
      'The Regent of Quiet Suns has declared the sanctuary’s destination a protected province before anyone has arrived.',
  },
  'brass-choir': {
    missionId: 'deposit-copy',
    penalty: 10,
    event:
      'The Brass Choir has offered to translate the crew’s account into the approved language, with the jokes removed.',
  },
  chancellor: {
    missionId: 'jump-gate-permit',
    penalty: 10,
    event:
      'Chancellor Tomorrow-Again filed the couch’s permit last week, already, with conditions.',
  },
  'kindly-swarm': {
    missionId: 'twins-summit',
    penalty: 10,
    event:
      'The Kindly Swarm proposes that the summit merge into a single delegate, which would solve the seating.',
  },
} as const

/** The nemesis's move at each Act III chapter (7, 8, 9): closing on the jump gate. */
export const ACT_THREE_MOVES: Record<
  keyof typeof ACT_THREE_NEMESIS,
  readonly [string, string, string]
> = {
  auditor: [
    'The Auditor has filed a claim against the jump gate itself and is charging the couch a toll in arrears.',
    'An itemized bill for the entire voyage arrives. Every rescue is listed under expenses.',
    'The Auditor waits at the jump gate with its ledger open to the last page, which is blank.',
  ],
  moth: [
    'The crew’s portraits in the captain’s log have been replaced with slightly better ones.',
    'The captain receives a letter in their own handwriting, thanking them for their resignation.',
    'The Queen waits at the jump gate wearing the face of someone the couch did not manage to save.',
  ],
  curdle: [
    'Curdle’s dispensers now line the route to the jump gate, each offering the same dish under a different name.',
    'Curdle has published a cookbook. It is one page long and extremely popular.',
    'Curdle waits at the jump gate holding one sealed bowl with the captain’s name on the lid.',
  ],
  showrunner: [
    'The Showrunner has started the countdown to its live finale. The couch is billed as the twist.',
    'The audience at the jump gate has been seated since yesterday. Refreshments are compulsory.',
    'The Showrunner waits at the jump gate with twelve cameras on the cushions and the red lamp lit.',
  ],
  regent: [
    'The Regent’s storm has been sighted, exactly where the Regent said it would be.',
    'Every port on the route has been offered shelter. Each acceptance letter arrived pre-signed.',
    'The Regent waits at the jump gate with his shield array deployed and a chair set out for the captain, facing his.',
  ],
  'brass-choir': [
    'The Choir has begun rehearsing the galaxy’s one song at the jump gate. It is in a key nobody can sing.',
    'The Choir has archived the couch. Its copy is a slightly more standard red.',
    'The Choir waits at the jump gate in a single line, every resonator tuned to the same note.',
  ],
  chancellor: [
    'The Chancellor’s press release about the couch has been revised again. It is now in the past tense.',
    'The crew’s memories of last week have small inconsistencies, each in the Chancellor’s favor.',
    'The Chancellor waits at the jump gate with the gilded clock set to five minutes before the voyage began.',
  ],
  'kindly-swarm': [
    'The Swarm has knitted a scarf long enough to go around the couch. It has not yet been asked to.',
    'Several passengers along the route have joined the Swarm and send their warm regards, together.',
    'The Swarm waits at the jump gate, very large and very gentle, holding the door.',
  ],
}

export const ACT_THREE_OPENING =
  'ACT III: THE LAST COMMAND. The chart has run out of systems that have not heard of the couch. Every route now leads, eventually, to the jump gate, where something is waiting. Two crates of supplies arrive with a card that says, in full, “Good luck.”'

/** Supplies delivered when Act III opens. */
export const ACT_THREE_RESUPPLY = 2
