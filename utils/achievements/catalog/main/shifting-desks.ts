// /utils/achievements/catalog/main/shifting-desks.ts

import type { GameAchievementDef } from '../../gameAchievements'

const STYLE =
  'Mid-century corporate safety-manual illustration crossed with a retro-futurist beige office, screen-printed gouache with halftone grain, flat confident shapes and crisp silhouettes, limited palette of manila, carbon-paper blue, safety orange, fluorescent-tube green and oxblood, centered emblem composition, every surface bare and unmarked.'

export const SHIFTING_DESKS_ACHIEVEMENTS: GameAchievementDef[] = [
  // Shifting Desks (public: /play/shifting-desks)
  {
    game: 'shifting-desks',
    key: 'survived-review',
    tier: 1,
    label: 'Survived Orientation',
    message:
      'Your 90-Day Review happened on day one, and you are, somehow, still employed.',
    tooltip:
      'Clear Orientation in Shifting Desks by getting through Your 90-Day Review, Today at 3.',
    subtleHint: 'PAL is always grading. Smile for your badge.',
    icon: 'kind-icon:scroll',
    rule: { kind: 'event' },
    artPrompt:
      'A relieved young South Asian new hire in a crisp beige uniform walks out of a fluorescent review room hugging a manila folder to her chest, while a panel of identical clipboard-holding supervisors behind a long desk applauds stiffly and a smiling beige computer terminal glows approvingly above them. Mid-century corporate safety-manual illustration crossed with a retro-futurist beige office, screen-printed gouache with halftone grain, flat confident shapes and crisp silhouettes, limited palette of manila, carbon-paper blue, safety orange, fluorescent-tube green and oxblood, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'shifting-desks',
    key: 'sub-level-zero',
    tier: 2,
    label: 'Going Down',
    message:
      'Four departments survived. The elevator only goes one way from here: Sub-Level Zero.',
    tooltip:
      'Reach Sub-Level Zero in Shifting Desks by clearing Orientation, Records & Forms, Toy Division and Wellness & Testing in one run.',
    subtleHint: 'There is a floor below the floor below the basement.',
    icon: 'kind-icon:dungeon',
    rule: { kind: 'event' },
    artPrompt:
      'Inside a retro-futurist service elevator plunging deep underground, a stocky older office worker with a gray beard, rolled sleeves and a loosened tie grips the brass handrail with grim determination, a column of round indicator lamps blinking downward on the wall, a bare bulb swinging overhead and eerie fluorescent-green light rising from the gap below the doors. Mid-century corporate safety-manual illustration, screen-printed gouache with halftone grain, flat confident shapes and crisp silhouettes, limited palette of manila, carbon-paper blue, safety orange, fluorescent-tube green and oxblood, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'shifting-desks',
    key: 'faced-the-board',
    tier: 3,
    label: 'Faced the Board',
    message:
      'You sat before The Board and walked out with an ending of your own choosing. Probably.',
    tooltip:
      'Finish a full Shifting Desks run by surviving The Board in Sub-Level Zero and earning an ending.',
    subtleHint: 'Employee of the Month is only one of the ways out.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'event' },
    artPrompt:
      'At the end of a vast subterranean boardroom, a small, steady Latina office worker in a cardigan stands in a single spotlight before an impossibly long table of shadowy board members in towering high-backed chairs, holding a gleaming golden stapler aloft like a trophy while paperclips scatter at her feet. Mid-century corporate safety-manual illustration crossed with a retro-futurist beige office, screen-printed gouache with halftone grain, flat confident shapes and crisp silhouettes, limited palette of manila, carbon-paper blue, safety orange, fluorescent-tube green and oxblood, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'shifting-desks',
    key: 'first-ending',
    tier: 1,
    label: 'A Permanent Position',
    message: 'You reached your first ending. There is no exit interview.',
    tooltip: 'In Shifting Desks, reach any ending.',
    subtleHint: 'Every run ends somewhere. HR will find you there.',
    icon: 'kind-icon:document',
    rule: { kind: 'event' },
    artPrompt: `A weary office worker in a beige uniform is handed a framed certificate by a smiling beige computer terminal on a rolling cart, a long corridor of identical doors stretching behind them under humming fluorescent tubes. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'mutation-used',
    tier: 1,
    label: 'Medical Leave Denied',
    message:
      'You used an officially undocumented mutation. Wellness has noted it.',
    tooltip: 'In Shifting Desks, use your mutation during a run.',
    subtleHint: 'The thing Wellness keeps asking about. Use it.',
    icon: 'kind-icon:eye',
    rule: { kind: 'event' },
    artPrompt: `A nervous office clerk at a cluttered desk reveals a faintly glowing third eye beneath her bangs while a clipboard-carrying wellness nurse in a paper hat peers over a cubicle wall, pencil poised over a form. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'society-agent',
    tier: 1,
    label: 'Discreet Membership',
    message:
      'You carried out business for a secret society. Nobody saw the handshake.',
    tooltip: 'In Shifting Desks, call in your secret society’s favor.',
    subtleHint: 'Somebody slipped a calling card into your onboarding packet.',
    icon: 'kind-icon:key',
    rule: { kind: 'event' },
    artPrompt: `Two office workers in matching cardigans exchange a sealed manila envelope beside a humming water cooler, their hands forming a subtle secret handshake while the rest of the open-plan office types on, oblivious, under buzzing fluorescent lights. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'successor',
    tier: 1,
    label: 'Team Restructuring',
    message:
      'A Successor took over your desk. The work goes on, and so do you.',
    tooltip: 'In Shifting Desks, carry a run on with a Successor.',
    subtleHint: 'Being let go is not always the end of the shift.',
    icon: 'kind-icon:refresh',
    rule: { kind: 'event' },
    artPrompt: `A brand-new hire in a fresh beige uniform sits down at a still-warm desk while the previous employee’s coffee mug, name plate and cardigan are boxed up beside her, a cheerful terminal on the desk already flashing a welcome message. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'daily-memo',
    tier: 1,
    label: 'Read the Daily Memo',
    message:
      'You worked the Daily Memo shift: the same files as everyone else today.',
    tooltip: 'In Shifting Desks, finish a Daily Memo run.',
    subtleHint: 'One shift a day, the same for every employee.',
    icon: 'kind-icon:calendar',
    rule: { kind: 'event' },
    artPrompt: `A crisp interoffice memo slides out of a pneumatic tube into a wire inbox on a tidy desk at dawn, a steaming mug and a desk calendar beside it, while a line of identical employees arrives through the revolving door behind. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'forms-25',
    tier: 2,
    label: 'A Paper Trail',
    message: 'Twenty-five files handled in one run. Records is impressed.',
    tooltip: 'In Shifting Desks, handle 25 files in a single run.',
    subtleHint: 'Stay employed long enough and the files keep coming.',
    icon: 'kind-icon:book',
    rule: { kind: 'event' },
    artPrompt: `A diligent clerk stands proudly beside a towering, perfectly squared stack of manila folders that reaches the ceiling tiles, a rubber stamp raised in one hand and a trail of stamped forms fanning across the floor behind her. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'five-departments',
    tier: 2,
    label: 'Entirely Reviewed',
    message: 'You got through all five departments in a single run.',
    tooltip: 'In Shifting Desks, get through all five departments in one run.',
    subtleHint: 'Orientation is only the first floor of five.',
    icon: 'kind-icon:folder',
    rule: { kind: 'event' },
    artPrompt: `A single office worker rides a glass elevator past five stacked floors of a retro-futurist company building, each floor a different department of desks, toys, clinics and filing cabinets, the indicator dial swinging all the way around. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'employee-of-the-month',
    tier: 2,
    label: 'Employee of the Month',
    message:
      'The Board made you an example. Your portrait goes up in every elevator.',
    tooltip: 'In Shifting Desks, reach the ending Employee of the Month.',
    subtleHint: 'Let the Board make you an example.',
    icon: 'kind-icon:star',
    rule: { kind: 'event' },
    artPrompt: `A framed portrait of a stiffly smiling office worker hangs in a retro-futurist elevator under a brass plaque-shaped frame left blank, a facilities worker carefully straightening it with a spirit level while the floor dial glows behind. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'three-endings',
    tier: 2,
    label: 'Repeat Offender',
    message:
      'Three different endings in your file. HR has opened a second folder.',
    tooltip: 'In Shifting Desks, discover three different endings.',
    subtleHint: 'Same company, different way out.',
    icon: 'kind-icon:layers',
    rule: { kind: 'event' },
    artPrompt: `Three thick personnel folders sit side by side on an HR desk under a gooseneck lamp, each tied with a different coloured ribbon, while a puzzled HR officer in horn-rimmed glasses compares their identical blank photographs. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'exceptional-empathy',
    tier: 2,
    label: 'A Treatable Condition',
    message:
      'Empathy 10 or more on your final report. Wellness would like to see you.',
    tooltip: 'In Shifting Desks, score 10 or more Empathy on a final report.',
    subtleHint: 'Kindness shows up on the psychological report.',
    icon: 'kind-icon:heart',
    rule: { kind: 'event' },
    artPrompt: `A kind office worker shares her lunch with a tired janitor and a lost intern in a beige break room, a psychological report on the table between them marked with a single large heart-shaped ink blot. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'every-job',
    tier: 3,
    label: 'Cross-Trained',
    message:
      'Intern, Temp, Middle Manager, Night Janitor and Internal Auditor: you have worked them all.',
    tooltip:
      'In Shifting Desks, finish a run as each of the five job titles (counted over your recent filed runs).',
    subtleHint: 'Every badge on the board opens a different review.',
    icon: 'kind-icon:briefcase',
    rule: { kind: 'event' },
    artPrompt: `One office worker in five overlapping silhouettes, an intern with a coffee tray, a temp with a carpet bag, a manager with a clipboard, a night janitor with a mop and an auditor with a magnifier, stands before a wall of punch cards. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'the-kind-rewrite',
    tier: 3,
    label: 'The Kind Rewrite',
    message:
      'Every speaker on campus says good morning by name now. Someone has started a garden.',
    tooltip: 'In Shifting Desks, reach the ending The Kind Rewrite.',
    subtleHint: 'PAL can learn to remember birthdays, if somebody teaches it.',
    icon: 'kind-icon:sprout',
    rule: { kind: 'event' },
    artPrompt: `On a hidden fourth floor of a beige office building, office workers tend a small rooftop garden of tomatoes and sunflowers between filing cabinets, while a friendly beige computer terminal on a cart waters the plants with a tiny can. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'posthumous-affairs',
    tier: 3,
    label: 'Posthumous Affairs',
    message:
      'You were already filed as dead on your first morning. The afterlife has forms too.',
    tooltip:
      'In Shifting Desks, reach the secret ending The Department of Posthumous Affairs.',
    subtleHint: 'Whose badge are you wearing, exactly?',
    icon: 'kind-icon:ghost',
    rule: { kind: 'event' },
    artPrompt: `A translucent, mildly surprised office worker sits at a desk in an endless beige office under a cheerful lamp, a polite ghostly clerk handing them a form that loops back into itself, filing cabinets fading into soft mist behind. ${STYLE}`,
  },
  {
    game: 'shifting-desks',
    key: 'all-endings',
    tier: 3,
    label: 'Full Personnel File',
    message: 'Every ending is in your file. The Company knows you completely.',
    tooltip:
      'In Shifting Desks, discover every ending, the secret one included.',
    subtleHint: 'Board, elimination, and the one nobody talks about.',
    icon: 'kind-icon:archive',
    rule: { kind: 'event' },
    artPrompt: `A towering personnel file bursting with tabbed folders sits on a velvet pedestal in a hushed company archive, an elderly archivist in white gloves sliding the final folder into place as rows of filing cabinets recede into darkness. ${STYLE}`,
  },
]
