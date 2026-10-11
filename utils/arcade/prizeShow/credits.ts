// /utils/arcade/prizeShow/credits.ts
//
// How Prize Show Panic's season ends (conductor kr-arcade t-032): the ending cards, the host's cheers
// in the Grand Prize Vault (TINSEL is on Sparkle's side in there), and the credits that roll after
// a clear. All original writing, in the arcade's pixel font (capitals, digits and . , ! ? - + = : /
// ( ) ' only).

import { ROSTER } from './roster'
import type { BossKind } from './season'

/** What the host shouts in the Vault, whatever the moment (except a lost contestant). */
export const VAULT_CHEERS: readonly string[] = [
  'GO ON, SPARKLE! THE WHOLE STUDIO IS BEHIND YOU!',
  'I BUILT THESE ROOMS TO STOP YOU. I TAKE IT ALL BACK.',
  'TEN GOLDEN TICKETS! NOBODY GETS THIS FAR. WELL. YOU DID.',
  'THE CRASHERS ARE CHEERING TOO. I THINK. HARD TO TELL.',
  'THIS IS THE BEST EPISODE WE HAVE EVER MADE!',
  'KEEP GOING! THE GRAND PRIZE IS JUST THROUGH THERE!',
]

export type EndingKind = 'show' | 'true'

/** The ending card: a heading and its lines. */
export const ENDINGS: Record<
  EndingKind,
  { title: string; lines: readonly string[] }
> = {
  show: {
    title: "THAT'S A WRAP ON THE SEASON!",
    lines: [
      'THE PRIZE MACHINE IS SCRAP.',
      'THE HOST HAS TAKEN A BOW.',
      'THE CRASHERS WENT HOME HAPPY.',
      '',
      'TEN GOLDEN TICKETS OPEN',
      'THE GRAND PRIZE VAULT...',
    ],
  },
  true: {
    title: 'THE GRAND PRIZE IS YOURS!',
    lines: [
      'THE VAULT IS EMPTY.',
      'THE CRASHERS HAVE ONE MORE REQUEST:',
      'THEY WANT TO STAY AND WATCH.',
      '',
      'EVERY PARTY CRASHER HAS JOINED',
      'THE STUDIO AUDIENCE!',
    ],
  },
}

/** What the host says as each ending begins. */
export const ENDING_LINES: Record<EndingKind, string> = {
  show: "THAT'S OUR SEASON! SAME TIME NEXT YEAR? I'LL BRING A BIGGER WHEEL.",
  true: "THE CRASHERS WANT TO STAY AND WATCH THE NEXT ONE. WE'LL ALLOW IT.",
}

/** The bosses as the credits bill them. */
const BOSS_BILLING: Record<BossKind, string> = {
  float: 'THE PARADE FLOAT',
  wobble: 'THE BIG WOBBLE',
  piecart: 'THE PIE CART',
  souffle: 'THE SOUFFLE SUPREME',
  mosh: 'THE MOSH MASCOT',
  jumbotron: 'THE JUMBOTRON',
  mothership: 'THE MOTHERSHIP',
  dragon: 'THE CONGA DRAGON',
  machine: 'THE PRIZE MACHINE',
}

/** The credits, top to bottom ('' is a gap; a line starting '*' is a heading). */
export function creditLines(ending: EndingKind): string[] {
  return [
    '*PRIZE SHOW PANIC',
    'A KIND ROBOTS ARCADE PRODUCTION',
    '',
    '*STARRING',
    'SPARKLE',
    '',
    '*YOUR HOST',
    'TINSEL',
    '',
    '*CO-HOST AND CAMERA',
    'LENS',
    '',
    '*THE PARTY CRASHERS',
    ...Object.values(ROSTER).map((r) => r.name),
    '',
    '*THE BIG ACTS',
    ...Object.values(BOSS_BILLING),
    '',
    '*THE SETS',
    'OPENING NIGHT',
    'COOKING SHOWDOWN',
    'COUNTDOWN CONCERT',
    'GALAXY PARADE',
    'THE LIVE FINALE',
    ...(ending === 'true' ? ['THE GRAND PRIZE VAULT'] : []),
    '',
    '*THE STUDIO AUDIENCE',
    ending === 'true' ? 'EVERYONE. EVEN THE CRASHERS.' : 'YOU, AT HOME',
    '',
    '*THANKS FOR WATCHING!',
    '',
    'THE SHOW GOES ON:',
    'A RERUN STARTS NOW, HARDER.',
  ]
}
