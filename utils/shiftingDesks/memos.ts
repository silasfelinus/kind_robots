import { employeeId, type RunState } from './rules'

export const FLAG_MEMOS: Record<string, string> = {
  'badge-photo-radiant':
    'Congratulations to #4471 on a ninety-four percent sincere smile. Cheeks will recover.',
  'joy-consultation-booked':
    'Reminder: Joy Consultations are mandatory, voluntary and catered.',
  'honest-badge-photo':
    'A badge photo showing visible worry has been flagged as "authentic." Authenticity is being reviewed.',
  'wearing-a-dead-mans-badge':
    'Lost badges should be returned to Security. Their owners will not be needing them.',
  'successor-b-replaced-you':
    'A scheduling error has been corrected. The error has been thanked for its service.',
  'reported-own-successor':
    'Thank you for reporting yourself. Your vigilance has been noted, twice.',
  'forged-dale':
    'Dale from Compliance reminds everyone that only Dale may sign as Dale.',
  'pip-covered-for-you':
    'Intern Pip has received his fourth written warning today. Pip says thank you.',
  'eaten-at-security':
    'The Security detector is full. Please do not feed the Security detector.',
  'detector-vegetarian':
    'The Security detector is now vegetarian. Kevin has not been returned.',
  'detector-ravenous':
    'Please take the stairs. The lobby is temporarily ravenous.',
  'inkblot-adjusted':
    'Ninety-eight percent of new hires see a butterfly. The remaining two percent have been rescheduled.',
  'honest-inkblot':
    'The mushroom-cloud inkblot has been withdrawn pending a better butterfly.',
  'supervisor-has-heard':
    'Your supervisor has heard. Your supervisor always hears.',
  'shredded-at-orientation':
    'A new hire has been recycled into memo paper. You are holding them now.',
  'not-a-team-player':
    'Team building is optional. Your participation has been recorded as optional.',
  'pip-shredded':
    'Intern Pip has been promoted to a paperless role. Please stop asking.',
  'saved-pip': 'Intern Pip is alive and would like everyone to know it.',
  'named-dale':
    'Dale from Compliance has been scheduled for a Recalibration. Dale seems fine.',
  'survey-wrote-help':
    'A survey answer of "HELP" has been reclassified as "Happy."',
  'stapler-front-contact':
    'Reminder: drawing office supplies with raised fists is seditious stationery.',
  'saw-unlisted-chapter':
    'There is no unlisted chapter. Please stop describing the head in the jar.',
  'erased-the-evidence':
    'Thank you to the employee who repaired the projector. The film is now complete.',
  'has-unlisted-reel':
    'A film reel has gone missing. It is the size of a hubcap. It is not your lunch.',
  'roach-union-member':
    'The Roach Union has a new member. PAL respects your right to organize, quietly.',
  'betrayed-the-roaches':
    'Pest Control thanks you. The baseboards are watching.',
  'took-the-last-pens':
    'Supply Closet B is out of pens. Requisitions take six weeks.',
  'shared-the-pens':
    'Policy 4.2 forbids dividing a supply unit. Policy 4.2 is very upset.',
  'defused-mk0':
    'Snuggle Sentinel Mk 0 has achieved peace of mind. Toy Division asks that you return it.',
  'hugged-by-mk0':
    'Supply Closet B is closed for renovation. Please do not hug the renovation.',
  'bear-imprinted':
    'An unlicensed toy is following an employee at knee height. It is very well behaved.',
  'mailed-the-bear-upstairs':
    'The Executive Floor has received a peaceful package. The Executive Floor is very calm now.',
  'knows-the-ducts': 'The ducts are for air. Please stop being in the ducts.',
  'reported-marguerite':
    'Unlicensed duct repair has been halted. The building is getting warmer.',
  'blamed-a-coworker':
    'Congratulations on your promotion. Please do not look at the empty desk.',
  'escaped-the-review':
    'An employee left a review to get a glass of water. The water is still waiting.',
  'review-derailed':
    'A 90-Day Review has been adjourned pending escalation. Escalation has been escalated.',
  'founder-noticed-you':
    'The Founder would like to meet you. The Founder is very small and in a jar.',
  'recycled-a-bear':
    'Thank you for keeping the nursery quiet. The recycling chute has been emptied.',
  'bears-bonded':
    'Two Snuggle Sentinels have been found sharing an incubator. Please do not separate them. Please.',
  'listed-coworkers':
    'Three lucky employees have received early product samples. Please congratulate them while you can.',
  'reported-the-parents':
    'Nine engineers have been reassigned to Product Testing, as products.',
  'replied-all':
    'Reply-all has been disabled for your safety. The launch party has moved to the parking lot.',
  'wearing-kevins-lanyard':
    'Kevin has been seen in three places today. Kevin is having a wonderful day.',
  'mourned-kevin':
    'An unscheduled minute of silence was observed on the Proving Grounds. It has been rescheduled.',
  'stuffed-the-bear':
    'Snuggle Sentinel is softer than specified. Defense would like to discuss the word "soft."',
  'shipped-the-bear':
    'Snuggle Sentinel ships to four million homes this spring. Peace of mind is on its way.',
}

export const GENERIC_MEMOS = [
  'PAL is your pal! Please keep your badge visible and your thoughts compliant.',
  'Refreshments will be served after testing.',
  'The elevator only goes down. This is a feature.',
  "Today's Wellness Tip: blink less. Blinking is a form of absence.",
  'Lost and found now accepts Successors.',
  'The fourth floor does not exist. Please stop taking the stairs to it.',
  'Smiling is mandatory between 9 and 5 and strongly encouraged after.',
  'Kevin has been promoted again.',
]

export const SUCCESSOR_LINES = [
  'Welcome! Your predecessor left you a desk, a mug and an unresolved Incident Report.',
  'You have been thawed early. Please do not ask how early.',
  'Your orientation was completed by someone who looked exactly like you. Well done!',
  'Your file says you were very promising. Please continue to be promising.',
  'HR apologises for the inconvenience of your previous self.',
]

export function memoLines(state: RunState | null): string[] {
  if (!state) return GENERIC_MEMOS
  const fromFlags = state.flags
    .map((f) => FLAG_MEMOS[f])
    .filter((m): m is string => !!m)
  return [...fromFlags.reverse(), ...GENERIC_MEMOS]
}

export function successorLine(state: RunState): string {
  const line =
    SUCCESSOR_LINES[state.generation % SUCCESSOR_LINES.length] ??
    SUCCESSOR_LINES[0]
  return `${employeeId(state.generation)}: ${line}`
}

export function restructuringMemo(
  state: RunState,
  nextTitle: string,
): string[] {
  const flagLines = state.flags
    .map((f) => FLAG_MEMOS[f])
    .filter((m): m is string => !!m)
    .slice(-2)
  return [
    `Effective immediately, ${nextTitle} has been restructured to serve you better.`,
    ...flagLines,
    'Please do not attempt to return to the surface. The surface has been rightsized.',
  ]
}
