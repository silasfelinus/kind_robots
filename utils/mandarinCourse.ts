// /utils/mandarinCourse.ts
//
// mandarin-tutor/t-028: the guided course.
//
// Silas, 2026-09-20: "i want a real front end interface. We start, are given an
// introduction, then shown cards that give info, basically, a streamlined teaching
// interface."
//
// m5 gave the project a teaching LAYER (utils/mandarinLesson.ts) and a reference page for
// it. What it did not give is a front door. /play/mandarin opened onto a tool -- mode
// tabs, a deck picker, a gallery, four workspace views -- which is the right shape for
// someone who already knows what they want and the wrong shape for someone who wants to
// be taught. This module turns a lesson into a SEQUENCE: one screen, one idea, forward
// motion, with the flashcard arriving as the payoff rather than the entry point.
//
// Pure, like every other derivation in this project: lessons in, steps out. No store, no
// network, no component imports, so the whole course shape is testable by
// utils/scripts/verifyMandarinCourse.test.ts.
import { isTeachingRole, type MandarinLesson } from './mandarinLesson'

/**
 * The five beats of one word's teaching run.
 *
 * Order is pedagogical, not structural: recognise the thing, hear it, take it apart,
 * place it among its relatives, then try to produce it from memory. `recall` is always
 * last and always present -- a run that never asks the learner to retrieve anything is a
 * slideshow, not a lesson.
 */
export type MandarinCourseBeat =
  'meet' | 'sound' | 'pieces' | 'family' | 'recall'

export type MandarinCourseStep =
  | {
      kind: 'intro'
      /** Stable id so a step can be keyed and resumed without relying on position. */
      id: string
      title: string
      body: string
      /** Optional worked example rendered as a row of glyph/label pairs. */
      example?: { glyph: string; label: string }[]
    }
  | {
      kind: 'word'
      id: string
      beat: MandarinCourseBeat
      cardKey: string
    }
  | { kind: 'done'; id: 'done' }

/**
 * The orientation sequence, shown once before the first word.
 *
 * This is the part Silas asked for by name ("we start, are given an introduction"), and
 * it is doing real work rather than being a welcome mat: the single biggest obstacle for
 * an English-speaking beginner is the belief that characters are pictures of their
 * meanings, and every card after this one is easier to read once that belief is gone.
 *
 * The last card sets expectations about the app itself, deliberately. Silas asked for
 * something "closer to duolingo" but explicitly not "insistent and focused on
 * interactions, notifications, nudges" -- so the course says out loud that nothing here
 * is timed and nothing will chase you. Saying it is cheaper than a learner discovering it
 * by waiting for a nag that never comes.
 */
export const MANDARIN_COURSE_INTRO: Extract<
  MandarinCourseStep,
  { kind: 'intro' }
>[] = [
  {
    kind: 'intro',
    id: 'intro-not-pictures',
    title: 'Characters are not pictures',
    body: 'A few are — 山 really is a mountain. But most characters are built from two jobs: one piece points at the meaning, and one piece points at the sound. Once you can tell which is which, a wall of unfamiliar characters turns into a small set of parts you already know, recombined.',
    example: [
      { glyph: '氵', label: 'means water' },
      { glyph: '青', label: 'sounds like qīng' },
      { glyph: '清', label: 'qīng — clear' },
    ],
  },
  {
    kind: 'intro',
    id: 'intro-tones',
    title: 'The tone is part of the word',
    body: 'Mandarin uses pitch to distinguish words, so a tone is not decoration on a syllable — it is a letter of it. The same syllable said four ways is four different words, and this course shows you the shape of each one rather than asking you to absorb it by ear alone.',
    example: [
      { glyph: 'mā', label: '妈 mother' },
      { glyph: 'má', label: '麻 hemp' },
      { glyph: 'mǎ', label: '马 horse' },
      { glyph: 'mà', label: '骂 to scold' },
    ],
  },
  {
    kind: 'intro',
    id: 'intro-families',
    title: 'Learn the family, not the character',
    body: 'A sound component gets reused across many characters. Learning 青 once gives you a foothold in every character built on it — and where a family has drifted apart in modern speech, this course tells you so instead of pretending the pattern is tidier than it is.',
    example: [
      { glyph: '请', label: 'qǐng' },
      { glyph: '清', label: 'qīng' },
      { glyph: '情', label: 'qíng' },
      { glyph: '晴', label: 'qíng' },
    ],
  },
  {
    kind: 'intro',
    id: 'intro-how-this-works',
    title: 'How this works',
    body: 'For each word you meet it, hear it, take it apart, see what shares its sound, and then try to recall it. Nothing here is timed, nothing is a streak, and nothing will chase you by notification. Stop whenever you like — what you have learned is saved, and the words you have already read come back when they are due, not when an app wants your attention.',
  },
]

export type MandarinWordRunOptions = {
  /**
   * True when this learner has already read the word's lesson through. The run collapses
   * to a single recall beat, which is what turns the course into a review session once a
   * deck has been learned rather than making someone re-read a lesson to reach a card
   * they already know.
   */
  alreadyLearned?: boolean
}

/**
 * The teaching beats for one word, with empty beats dropped.
 *
 * Skipping is the whole reason this is a function rather than a constant. A plain
 * vocabulary word whose source asserts nothing about its structure has no honest
 * `pieces` card to show, and a character no other catalog card shares a sound component
 * with has no `family` card. Rendering those as empty screens would teach the learner
 * that the course pads, which is exactly the habit utils/mandarinLesson.ts's honesty
 * contract exists to avoid.
 */
export function buildWordRun(
  lesson: MandarinLesson,
  options: MandarinWordRunOptions = {},
): MandarinCourseStep[] {
  const step = (beat: MandarinCourseBeat): MandarinCourseStep => ({
    kind: 'word',
    id: `${lesson.key}:${beat}`,
    beat,
    cardKey: lesson.key,
  })

  if (options.alreadyLearned) return [step('recall')]

  const beats: MandarinCourseBeat[] = ['meet', 'sound']

  // `pieces` needs at least one component the source gives a JOB to.
  //
  // This rule was the opposite way round until 2026-09-20, and it was wrong. The old
  // test was "does this word have any components at all", on the reasoning that a
  // structural leaf is still worth seeing as long as it is labelled honestly. Silas hit
  // the result on 的 -- the most common character in the language -- and said: "wtf,
  // there are phrases that mean nothing."
  //
  // He was right. That screen was titled "What 的 is built from", opened by stating that
  // 的 could not be taken apart, and then took it apart into 白 and 勺 under two
  // paragraphs explaining at length that neither of them means anything here. A card
  // whose entire content is four different ways of saying "we don't know" is not honest,
  // it is padding -- the exact habit the empty-beat skipping above exists to prevent. If
  // there is no claim to teach, there is no teaching card; `meet` already carries the
  // word, and its summary now says in one clause that the parts do not explain it.
  if (
    lesson.characters.some((entry) =>
      entry.components.some((component) => isTeachingRole(component.role)),
    )
  ) {
    beats.push('pieces')
  }

  if (lesson.soundFamilies.length > 0) beats.push('family')

  beats.push('recall')
  return beats.map(step)
}

export type MandarinCoursePlanInput = {
  lessons: MandarinLesson[]
  /** Card keys whose lesson this learner has already completed. */
  learnedKeys?: ReadonlySet<string>
  includeIntro?: boolean
}

/**
 * The whole session: optional intro, then one run per word, then a closing step.
 *
 * Order is the caller's -- the queue decides which words are taught and in what order,
 * because that is a scheduling question (unlearned first, then due for review) rather
 * than a teaching one. This function only decides what a word's teaching looks like once
 * it has been chosen.
 */
export function buildCoursePlan(
  input: MandarinCoursePlanInput,
): MandarinCourseStep[] {
  const learned = input.learnedKeys ?? new Set<string>()
  const steps: MandarinCourseStep[] = []

  if (input.includeIntro) steps.push(...MANDARIN_COURSE_INTRO)

  for (const lesson of input.lessons) {
    steps.push(
      ...buildWordRun(lesson, { alreadyLearned: learned.has(lesson.key) }),
    )
  }

  steps.push({ kind: 'done', id: 'done' })
  return steps
}

/**
 * Where the learner is, as a fraction of the words in the session rather than of the
 * steps.
 *
 * Counting steps would make the bar lurch: a word with a sound family is a 5-step run
 * and a bare vocabulary item is 3, so step-based progress would appear to slow down on
 * exactly the words that teach the most. Words are the unit the learner actually
 * perceives, so words are what the bar measures.
 */
export function courseProgress(
  steps: MandarinCourseStep[],
  index: number,
): { wordsDone: number; wordsTotal: number; ratio: number } {
  const order: string[] = []
  for (const step of steps) {
    if (step.kind !== 'word') continue
    if (!order.includes(step.cardKey)) order.push(step.cardKey)
  }

  const wordsTotal = order.length
  if (!wordsTotal) return { wordsDone: 0, wordsTotal: 0, ratio: 0 }

  const seen = new Set<string>()
  for (let i = 0; i < Math.min(index, steps.length); i += 1) {
    const step = steps[i]
    if (step?.kind === 'word') seen.add(step.cardKey)
  }

  // A word in progress is not a word done: only count the ones fully behind us.
  const current = steps[index]
  if (current?.kind === 'word') seen.delete(current.cardKey)

  const wordsDone = seen.size
  return { wordsDone, wordsTotal, ratio: wordsDone / wordsTotal }
}

/**
 * The teaching beats of a word, i.e. everything before its recall.
 *
 * The course marks a lesson complete when the learner reaches the recall beat, because
 * that is the moment they have actually been shown the whole lesson. A run that is only
 * a recall (a review of an already-learned word) has no teaching beats and must not
 * re-award anything -- the server enforces once-per-card too, but the client should not
 * be sending a claim it knows is empty.
 */
export function runTeachesAnything(run: MandarinCourseStep[]): boolean {
  return run.some((step) => step.kind === 'word' && step.beat !== 'recall')
}
