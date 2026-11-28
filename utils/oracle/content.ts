// /utils/oracle/content.ts
//
// Authored reading content for the full 78-card Kind Oracle (kind-oracle/t-005,
// tarot-studio reader). Majors are hand-written; minors use the spec's
// generic suit-and-rank grammar (projects/kind-oracle/docs/spec.md), so every
// spread resolves to complete text with no LLM at runtime.

import type {
  OracleCard,
  OracleContent,
  OracleEnergy,
  OracleSuit,
} from './types'
import { ORACLE_POSITION_TEXT } from './positionText'

type MajorEntry = [
  id: string,
  title: string,
  energy: OracleEnergy,
  upright: string,
  reversed: string,
  prompt: string,
]

const MAJORS: MajorEntry[] = [
  [
    'the-newly-woken',
    'The Newly Woken',
    'begin',
    'Everything is fresh, and you are allowed to not know yet. Step forward with open hands and a curious heart; the path appears as you walk it, and wonder is a perfectly good map.',
    'You may be hesitating at the edge, or leaping without looking at all. Pause for one honest breath, check what you are carrying, then take the next small, brave step on purpose.',
    'What are you ready to begin, even imperfectly?',
  ],
  [
    'the-tinkerer',
    'The Tinkerer',
    'build',
    'You already hold the parts you need. Lay out your tools, trust your hands and make something real; focused attention turns scattered ideas into a working machine.',
    'Your talents may feel scattered or stuck in planning. Choose one tool and one small project, and let finishing something modest remind you how capable you are.',
    'What could you make with what you already have?',
  ],
  [
    'the-quiet-archivist',
    'The Quiet Archivist',
    'hold',
    'There is wisdom in listening before speaking. Your intuition has been quietly collecting clues; give it some stillness and it will hand you exactly the page you need.',
    'You may be ignoring an inner nudge or keeping too much to yourself. Write down what you already sense, and share one quiet truth with someone you trust.',
    'What does your quietest voice already know?',
  ],
  [
    'the-gardener',
    'The Gardener',
    'flow',
    'Growth is happening, generously and in its own season. Tend what you love with patience, enjoy your senses and let abundance spill over to the people around you.',
    'You may be pouring care into everyone except yourself, or forcing a bloom too early. Water your own roots today, and let something grow at its natural pace.',
    'What needs gentle tending to flourish?',
  ],
  [
    'the-lighthouse-keeper',
    'The Lighthouse Keeper',
    'build',
    'Steady structure keeps everyone safe through the storm. Set clear boundaries, keep your promises and shine your light reliably; your calm leadership helps others find their way.',
    'Control may be tightening into rigidity, or the light has been left untended. Loosen one rule that no longer serves, and recommit to the one that truly matters.',
    'What structure would help you feel steady?',
  ],
  [
    'the-storyteller',
    'The Storyteller',
    'hold',
    'Old stories carry tested wisdom. Learn from a mentor, honor a tradition that nourishes you and pass on what you know; belonging grows when knowledge is shared.',
    'An old rule may no longer fit who you are becoming. Keep the heart of the tradition, rewrite the parts that pinch and tell the story your own way.',
    'Which story or teacher is guiding you now?',
  ],
  [
    'the-two-bots',
    'The Two Bots',
    'open',
    'A meaningful connection or choice is asking for your whole heart. Choose from your values, share your power cell generously and let partnership make both of you brighter.',
    'You may feel torn between paths or out of step with someone close. Return to what you truly value, and let that compass guide the next honest conversation.',
    'What choice reflects your deepest values?',
  ],
  [
    'the-wayfarer',
    'The Wayfarer',
    'shift',
    'Momentum is on your side. Hold the reins of competing wishes, set your direction and roll forward with confidence; determination carries you across surprising distances.',
    'You may be pulled in two directions or pushing too hard against the road. Stop to realign your wheels, then move ahead at a pace you can actually sustain.',
    'Where do you want your momentum to take you?',
  ],
  [
    'the-gentle-giant',
    'The Gentle Giant',
    'hold',
    'True strength is soft hands and a patient heart. Meet wild feelings with kindness rather than force, and you will find a courage that never needs to shout.',
    'You may be doubting your own strength or gripping too tightly. Breathe slowly, speak kindly to yourself and remember that gentleness has carried you through before.',
    'Where could kindness be your greatest strength?',
  ],
  [
    'the-lantern-bearer',
    'The Lantern Bearer',
    'open',
    'Stepping back brings things into focus. Take a quiet walk with your own thoughts, follow the small light of your inner knowing and return with insight worth sharing.',
    'Solitude may have tipped into loneliness, or you are avoiding needed reflection. Reach out to one kind person, or carve out one quiet hour, whichever you have missed.',
    'What becomes clear when you slow down?',
  ],
  [
    'the-wheel',
    'The Great Cog Wheel',
    'shift',
    'The gears are turning and a new season is arriving. Lean into the change, notice the lucky openings and trust that cycles bring returns as well as departures.',
    'Change may feel like it is happening to you rather than with you. Focus on the one gear you can turn today, and let the rest of the wheel do its work.',
    'What new season is turning toward you?',
  ],
  [
    'the-fair-scale',
    'The Fair Scale',
    'hold',
    'Honesty and balance light the way. Weigh things clearly, take responsibility for your part and choose what is fair; truth spoken kindly brings lasting peace.',
    'Something may feel lopsided, or you are being harder on yourself than anyone else. Look again with fresh fairness, and set down any weight that is not yours.',
    'What would a truly fair choice look like?',
  ],
  [
    'the-upside-down-bot',
    'The Upside-Down Bot',
    'open',
    'Hanging still for a moment changes the whole view. Surrender the need to rush, see things from a new angle and let a pause reveal what effort could not.',
    'You may be stuck waiting, or resisting a pause you truly need. Decide whether this is rest or delay, then either let go fully or gently set yourself right side up.',
    'What would you notice from a new angle?',
  ],
  [
    'the-shedding',
    'The Shedding',
    'end',
    'Old plating is falling away to make room for something new. Let a finished chapter close with gratitude; endings clear the ground where your next growth begins.',
    'You may be holding on to something that has already finished its work. Thank it, set it down gently and give yourself time to feel lighter.',
    'What are you ready to set down with thanks?',
  ],
  [
    'the-mender',
    'The Mender',
    'flow',
    'Healing happens through patient blending. Mix a little of this with a little of that, find the middle way and let moderation stitch together what felt split apart.',
    'Life may feel out of proportion, too much here and too little there. Adjust one small habit toward balance, and let steady repair do its quiet work.',
    'What in your life wants gentle balancing?',
  ],
  [
    'the-tangle',
    'The Tangle',
    'hold',
    'Notice the cables you have wrapped around yourself. Habits and attachments are easier to loosen once seen clearly; naming the knot is the first pull toward freedom.',
    'You are already working one strand loose. Celebrate that progress, ask for help with the stubborn knots and remember the tangle never defined who you are.',
    'Which habit is ready to be untangled?',
  ],
  [
    'the-short-circuit',
    'The Short Circuit',
    'shift',
    'A sudden jolt is clearing out what was built on shaky wiring. Let the sparks fly, step back to safety and trust that honest rebuilding follows the shake-up.',
    'You may be bracing against a change that wants to happen. Release what is already cracking, gently and on purpose, so the shift can be smaller and kinder.',
    'What shaky structure is ready to be rebuilt?',
  ],
  [
    'the-night-sky-bot',
    'The Night-Sky Bot',
    'open',
    'After the storm comes a clear, starry sky. Hope is returning, healing is underway and you are free to share your light openly; the universe feels generous tonight.',
    'Hope may feel far away or hard to trust. Look for one small star, a kind word or tiny win, and let it be enough to keep you going.',
    'What gives you hope right now?',
  ],
  [
    'the-moon-pool',
    'The Moon Pool',
    'flow',
    'Not everything is clear yet, and that is all right. Let dreams and intuition speak in images; the reflection may show a side of you worth getting to know.',
    'Confusion may be lifting, or worries are making shadows seem larger. Turn on a light: ask a question, check a fact and trust what you find.',
    'What is your intuition trying to show you?',
  ],
  [
    'the-sunrise-engine',
    'The Sunrise Engine',
    'begin',
    'Warmth, joy and vitality flood in. Open your panels to the light, celebrate what is going well and let your natural brightness make the whole day easier.',
    'Your sunshine may be hidden behind a cloud of tiredness or doubt. Step outside, do one joyful thing and let a little light recharge you.',
    'What fills you with simple joy today?',
  ],
  [
    'the-reboot',
    'The Reboot',
    'end',
    'A clear call is waking you up to a new level. Reflect honestly on how far you have come, forgive what needs forgiving and answer the invitation to rise.',
    'You may be avoiding a call or judging yourself too harshly. Hear the invitation with compassion, and take one step toward the version of you that is waking up.',
    'What calling is asking you to rise?',
  ],
  [
    'the-whole-world',
    'The Whole World',
    'end',
    'A circle is complete and you belong right where you are. Celebrate the journey, honor everyone who helped and enjoy a deep sense of wholeness before the next adventure.',
    'Something is nearly finished but not quite closed. Tie up one loose end, gather your lessons and let yourself feel the satisfaction you have earned.',
    'What journey are you ready to celebrate completing?',
  ],
]

type SuitEntry = {
  id: OracleSuit
  title: string
  domain: string
  short: string
  uprightTail: string
  reversedTail: string
}

const SUITS: SuitEntry[] = [
  {
    id: 'sparks',
    title: 'Sparks',
    domain: 'your drive and creative fire',
    short: 'your creative fire',
    uprightTail: 'Let enthusiasm lead and share the warmth.',
    reversedTail: 'Rest the flame, then rekindle it on purpose.',
  },
  {
    id: 'currents',
    title: 'Currents',
    domain: 'your feelings and friendships',
    short: 'your heart',
    uprightTail: 'Let feelings flow and connection deepen.',
    reversedTail: 'Be tender with your heart while it settles.',
  },
  {
    id: 'breezes',
    title: 'Breezes',
    domain: 'your thoughts and words',
    short: 'your thinking',
    uprightTail: 'Speak clearly and let fresh air in.',
    reversedTail: 'Quiet the chatter and find one clear thought.',
  },
  {
    id: 'cogs',
    title: 'Cogs',
    domain: 'your work, home and resources',
    short: 'your daily life',
    uprightTail: 'Steady hands make sturdy, lasting things.',
    reversedTail: 'Simplify, mend and take it one gear at a time.',
  },
]

type RankEntry = {
  id: string
  title: string
  order: number
  energy: OracleEnergy
  upright: (domain: string) => string
  reversed: (domain: string) => string
  prompt: (short: string) => string
}

const RANKS: RankEntry[] = [
  {
    id: 'ace',
    title: 'Ace',
    order: 1,
    energy: 'begin',
    upright: (d) =>
      `A bright new seed is being offered to ${d}. Accept the gift with both hands and plant it somewhere it can grow.`,
    reversed: (d) =>
      `A fresh start in ${d} may be waiting for the right moment. Clear a little space so it can take root.`,
    prompt: (s) => `What new seed is arriving in ${s}?`,
  },
  {
    id: 'two',
    title: 'Two',
    order: 2,
    energy: 'open',
    upright: (d) =>
      `Two forces in ${d} are ready to pair up or be balanced. A thoughtful choice or partnership opens the way forward.`,
    reversed: (d) =>
      `Something in ${d} feels out of balance or undecided. Name both options honestly before you choose either one.`,
    prompt: (s) => `What two things in ${s} need balancing?`,
  },
  {
    id: 'three',
    title: 'Three',
    order: 3,
    energy: 'build',
    upright: (d) =>
      `First growth is showing in ${d}. Teamwork and shared effort help the young sprout become something real and sturdy.`,
    reversed: (d) =>
      `Growth in ${d} may be slowed by working alone. Invite collaborators and let others add their part.`,
    prompt: (s) => `Who could help ${s} grow right now?`,
  },
  {
    id: 'four',
    title: 'Four',
    order: 4,
    energy: 'hold',
    upright: (d) =>
      `A season of rest and stability settles over ${d}. Enjoy the solid ground you have built and take a restoring pause.`,
    reversed: (d) =>
      `Rest in ${d} may have become restlessness, or stillness has turned stuck. Choose a pause that truly restores you.`,
    prompt: (s) => `What kind of rest does ${s} need?`,
  },
  {
    id: 'five',
    title: 'Five',
    order: 5,
    energy: 'shift',
    upright: (d) =>
      `A stretch of strain is testing ${d}. Challenges here are temporary and teach you what you truly need to keep.`,
    reversed: (d) =>
      `The hardest part in ${d} is easing. Accept help, mend what was bent and notice how much you have learned.`,
    prompt: (s) => `What is this challenge teaching ${s}?`,
  },
  {
    id: 'six',
    title: 'Six',
    order: 6,
    energy: 'flow',
    upright: (d) =>
      `Giving and receiving flow freely through ${d}. Generosity returns to you, and kindness shared now keeps circulating.`,
    reversed: (d) =>
      `The exchange in ${d} may feel one-sided. Let yourself receive as well as give, and keep the circle fair.`,
    prompt: (s) => `What could ${s} give or receive today?`,
  },
  {
    id: 'seven',
    title: 'Seven',
    order: 7,
    energy: 'hold',
    upright: (d) =>
      `A test of faith arrives for ${d}. Hold your ground with patience and trust that steady effort is quietly paying off.`,
    reversed: (d) =>
      `Doubt may be creeping into ${d}. Revisit why you started, and decide which commitments still deserve your energy.`,
    prompt: (s) => `What do you still believe about ${s}?`,
  },
  {
    id: 'eight',
    title: 'Eight',
    order: 8,
    energy: 'build',
    upright: (d) =>
      `Craft and practice are shaping ${d}. Focused repetition turns effort into skill, and every careful pass makes the work finer.`,
    reversed: (d) =>
      `Practice in ${d} may feel like a grind or has slipped away. Reconnect with the joy of the craft itself.`,
    prompt: (s) => `What skill is ${s} quietly mastering?`,
  },
  {
    id: 'nine',
    title: 'Nine',
    order: 9,
    energy: 'end',
    upright: (d) =>
      `${d.charAt(0).toUpperCase()}${d.slice(1)} is nearly complete. Pause to appreciate what you have gathered and trust the last stretch.`,
    reversed: (d) =>
      `The finish line in ${d} may feel strangely far. Ease up on worry, ask for support and let good enough be enough.`,
    prompt: (s) => `What in ${s} is almost finished?`,
  },
  {
    id: 'ten',
    title: 'Ten',
    order: 10,
    energy: 'end',
    upright: (d) =>
      `Fullness arrives in ${d}, a whole cycle gathered in. Savor the abundance and share the load so it stays a blessing.`,
    reversed: (d) =>
      `Too much may be piled onto ${d}. Set down what is not yours to carry and keep what still brings you life.`,
    prompt: (s) => `What could ${s} share or set down?`,
  },
  {
    id: 'apprentice',
    title: 'Apprentice',
    order: 11,
    energy: 'begin',
    upright: (d) =>
      `A curious learner brings fresh questions to ${d}. Stay playful, ask everything and let beginner's eyes reveal what experts miss.`,
    reversed: (d) =>
      `Curiosity in ${d} may be scattered or shy. Pick one question you genuinely care about and follow it a little further.`,
    prompt: (s) => `What does ${s} want to learn next?`,
  },
  {
    id: 'wanderer',
    title: 'Wanderer',
    order: 12,
    energy: 'shift',
    upright: (d) =>
      `An eager traveler is on the move in ${d}. Pursue what calls you with energy and let action open doors.`,
    reversed: (d) =>
      `Pursuit in ${d} may be rushing ahead or stalling out. Check your direction before you speed up again.`,
    prompt: (s) => `Where is ${s} eager to go?`,
  },
  {
    id: 'keeper',
    title: 'Keeper',
    order: 13,
    energy: 'flow',
    upright: (d) =>
      `A caring guardian watches over ${d}. Nurture with warmth and wisdom, and your steady presence helps everything nearby thrive.`,
    reversed: (d) =>
      `Caring for ${d} may have left you running low. Turn some of that nurturing inward and refill your own cup.`,
    prompt: (s) => `How could you care for ${s} today?`,
  },
  {
    id: 'elder',
    title: 'Elder',
    order: 14,
    energy: 'hold',
    upright: (d) =>
      `Seasoned mastery guides ${d}. Lead with calm experience, make fair decisions and share what you know generously.`,
    reversed: (d) =>
      `Mastery in ${d} may have hardened into control. Stay open to new ideas, and let others lead sometimes.`,
    prompt: (s) => `What wisdom about ${s} could you share?`,
  },
]

export const ORACLE_SUIT_TITLES: Record<OracleSuit, string> = {
  sparks: 'Sparks',
  currents: 'Currents',
  breezes: 'Breezes',
  cogs: 'Cogs',
}

export const ORACLE_CARDS: OracleCard[] = [
  ...MAJORS.map(([id, title, energy, upright, reversed, prompt], order) => ({
    id,
    arcana: 'major' as const,
    order,
    title,
    energy,
    upright,
    reversed,
    prompt,
  })),
  ...SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${rank.id}-of-${suit.id}`,
      arcana: 'minor' as const,
      order: rank.order,
      suit: suit.id,
      title: `${rank.title} of ${suit.title}`,
      energy: rank.energy,
      upright: `${rank.upright(suit.domain)} ${suit.uprightTail}`,
      reversed: `${rank.reversed(suit.domain)} ${suit.reversedTail}`,
      prompt: rank.prompt(suit.short),
    })),
  ),
]

export const ORACLE_CARD_BY_ID: Record<string, OracleCard> = Object.fromEntries(
  ORACLE_CARDS.map((card) => [card.id, card]),
)

const ENERGY_PHRASES: Record<OracleEnergy, [string, string]> = {
  begin: ['a fresh beginning', 'starting'],
  build: ['steady building', 'making'],
  hold: ['patient holding', 'keeping'],
  flow: ['easy flow', 'letting things move'],
  shift: ['a turning shift', 'changing course'],
  end: ['a gentle completion', 'finishing'],
  open: ['an opening view', 'seeing anew'],
}

const ENERGIES = Object.keys(ENERGY_PHRASES) as OracleEnergy[]

function energyPairText(
  a: OracleEnergy,
  b: OracleEnergy,
  kind: 'echo' | 'contrast',
): string {
  const [nounA, verbA] = ENERGY_PHRASES[a]
  const [nounB, verbB] = ENERGY_PHRASES[b]
  if (a === b) {
    return kind === 'echo'
      ? `These two cards repeat the theme of ${nounA}: the message is worth hearing twice.`
      : `Both cards speak of ${nounA}, one freely and one with hesitation; notice which voice feels more like you right now.`
  }
  return kind === 'echo'
    ? `${nounA.charAt(0).toUpperCase()}${nounA.slice(1)} leads naturally into ${nounB}; ${verbA} and ${verbB} can work hand in hand.`
    : `${nounA.charAt(0).toUpperCase()}${nounA.slice(1)} and ${nounB} pull a little differently here, so balance ${verbA} with ${verbB} at your own pace.`
}

const energyPairs: Record<string, string> = {}
for (const a of ENERGIES) {
  for (const b of ENERGIES) {
    if (a > b) continue
    for (const kind of ['echo', 'contrast'] as const) {
      energyPairs[`${a}|${b}:${kind}`] = energyPairText(a, b, kind)
    }
  }
}

export const ORACLE_CONTENT: OracleContent = {
  openings: {
    one: [
      'Take a breath. One card has stepped forward to keep you company today.',
      'Here is a single companion for the day ahead.',
      'One card, one gentle nudge: let it sit beside you for a while.',
    ],
    three: [
      'Three cards, one story: where you have been, where you are and what is opening.',
      'Here is the shape of your path, told in three cards.',
      'Let these three cards walk with you from yesterday into tomorrow.',
    ],
    five: [
      'Five cards gather around your question to look at it from every side.',
      'Here is a fuller picture, laid out in five kind cards.',
      'Settle in. Five cards are ready to talk this through with you.',
    ],
  },
  closings: {
    one: [
      'Carry this card with you, and check in with it tonight.',
      'Let that be enough for today.',
      'Whatever happens, you are not walking alone.',
    ],
    three: [
      'Your story is still being written, and the next line is yours.',
      'Take what helps and leave the rest.',
      'Every chapter matters, including this one.',
    ],
    five: [
      'You have more help, and more wisdom, than you might think.',
      'Return to this spread whenever you need a kinder view.',
      'Choose one small step, and let the rest unfold.',
    ],
  },
  positionText: ORACLE_POSITION_TEXT,
  energyPairs,
  specialPairs: {
    'the-newly-woken|the-reboot':
      'A first waking and a great reawakening: a whole cycle is coming home to a fresh start.',
    'the-mender|the-two-bots':
      'Partnership and repair together: a connection is ready to be gently mended.',
    'the-night-sky-bot|the-short-circuit':
      'After the jolt, the stars: what fell apart is making room for hope.',
    'the-shedding|the-sunrise-engine':
      'An ending followed by sunrise: letting go is exactly what lets the light in.',
    'the-lantern-bearer|the-quiet-archivist':
      'Two quiet guides together: your inner wisdom is especially clear right now.',
    'the-gardener|the-whole-world':
      'Patient tending meets completion: something you nurtured is ready to be celebrated.',
    'the-gentle-giant|the-tangle':
      'Gentle strength meets a knot: kindness, not force, will loosen it.',
    'the-moon-pool|the-sunrise-engine':
      'Moonlight gives way to sunlight: what felt murky is about to become clear and warm.',
    'the-tinkerer|the-wheel':
      'Skill meets the turning wheel: you can help steer this change with your own hands.',
    'the-fair-scale|the-lighthouse-keeper':
      'Fairness and steady structure: clear, kind rules will keep everyone safe.',
    'the-quiet-archivist|the-storyteller':
      'The keeper of books and the teller of tales together: what you have quietly learned is ready to be shared out loud.',
    'the-gardener|the-sunrise-engine':
      'Patient tending meets full sunshine: what you have grown is ready to bloom in the open.',
    'the-short-circuit|the-tangle':
      'A jolt and a knot side by side: the shake-up is loosening something that held you too tightly.',
    'the-lighthouse-keeper|the-wayfarer':
      'A steady beacon and a traveler on the move: you have both a direction and the light to follow it.',
    'the-upside-down-bot|the-wheel':
      'A pause meets a turning wheel: loosening your grip lets the next season arrive on its own.',
    'the-mender|the-shedding':
      'A closing and a mending together: what ends now can be repaired into something new and whole.',
    'the-gentle-giant|the-night-sky-bot':
      'Quiet strength beside fresh hope: be as gentle with yourself as you are with everyone else while you heal.',
    'the-fair-scale|the-reboot':
      'Fairness meets a wake-up call: an honest, kind look back makes the next chapter feel lighter.',
    'the-moon-pool|the-quiet-archivist':
      'Dreams and deep knowing together: trust the quiet images and notes that keep returning to you.',
    'the-newly-woken|the-whole-world':
      'The first step and the full circle: every journey you finish makes room for a brand-new beginning.',
  },
}
