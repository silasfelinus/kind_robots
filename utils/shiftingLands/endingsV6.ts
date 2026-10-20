import type { TrialResult } from './authoredBosses'
import { MARKS, type JourneyStateV6, type Mark, type Marks } from './deckV6'

export type EndingKind =
  | 'shared-well'
  | 'open-door'
  | 'masked-rule'
  | 'scarred-witness'
  | 'last-loaf'
  | 'unsealed-book'
  | 'bell-again'
  | 'unmarked-ford'
  | 'salt-crown'
  | 'unnamed-road'

export type AuthoredEndingV6 = {
  kind: EndingKind
  title: string
  path: string
  paragraphs: string[]
}

type TerminalPhase = 'complete' | 'fallen' | 'retired'
type EndingCopy = {
  title: string
  path: string
  opening: string
  complete: string
  fallen: string
  retired: string
}

const ENDINGS: Record<EndingKind, EndingCopy> = {
  'shared-well': {
    title: 'A Well With No Lock',
    path: 'Mercy and truth',
    opening: 'Someone has scratched two household marks onto the same water cup. Neither has been crossed out. You know how much arguing it takes to make so small a thing possible.',
    complete: 'You leave the Verge with no deed to the spring and no authority to ration it. Instead, you leave names, witnesses, and a way of settling the next quarrel before anyone draws a knife. Neither family calls it victory. Both return to the well tomorrow.',
    fallen: 'You do not reach the final crossing. Behind you, the families who learned to share water are still arguing over buckets. They must work it out without you. That is a harder gift to leave than a full flask.',
    retired: 'You turn aside before the last gate, leaving the wells to their neighbors. They still quarrel. They also know the other household will arrive with a cup in the morning.',
  },
  'open-door': {
    title: 'The Door Held Open',
    path: 'Mercy and courage',
    opening: 'You remember a door that might have stayed closed and the person waiting on its other side. Courage feels less like drawing steel than refusing to leave when everyone else wants to run.',
    complete: 'You cross the final threshold without a procession. Somewhere behind you, another traveler finds shelter because someone remembers how you stood at the door. There is no monument. The latch must still be lifted every night.',
    fallen: 'The road takes your strength, but cannot close every door you opened. Those you helped may shut them again. One chooses not to.',
    retired: 'You cannot guard every frightened household. You leave before the last trial, and discover that the doors you held open do not all swing shut when you walk away.',
  },
  'masked-rule': {
    title: 'The Toll Nobody Sees',
    path: 'Cunning and ruthlessness',
    opening: 'You know where the ledgers live, which uniforms frighten people, and how little a law must say before someone obeys. Even the old wardens ask whose signature you carry.',
    complete: 'Beyond the Verge you hold the keys and none of the locks. Travelers call the new toll fair because you collect it without raising your voice. You know exactly how that story is made.',
    fallen: 'Your last bargain comes due where no one accepts a false name. Someone else picks up the ledger, its neat columns ready to turn another debt into an order.',
    retired: 'You step away from the last gate while the smaller crossings still answer to you. Nobody sees a throne. They see a toll posted in a familiar hand and pay.',
  },
  'scarred-witness': {
    title: 'The Truth With Teeth',
    path: 'Honesty and force',
    opening: 'You tell the truth even when people hate you for it. But sometimes it arrives with your fist on the table. Witnesses remember the words and the sound of the blow separately.',
    complete: 'You carry a record no official can easily bury. Some doors open because of its evidence. Others open when their owners see your hands. The difference matters, even if the story rarely admits it.',
    fallen: 'The evidence survives you, along with the fear of the one who gathered it. When someone reads the names aloud, a child asks if they are true. Nobody answers at once.',
    retired: 'Others begin copying your testimony after you withdraw. They leave out the parts where you hurt people to make them listen. You do not correct every copy.',
  },
  'last-loaf': {
    title: 'The Last Loaf',
    path: 'Mercy',
    opening: 'You have eaten less so that strangers could eat at all. Sometimes they returned half their supper. Often they did not. Bread broken at a stranger’s table carries no guarantee.',
    complete: 'Past the final gate there is no reward waiting for your kindness. There are people who know how to share before they learn your name. That is enough for tonight. Tomorrow has its own mouths to feed.',
    fallen: 'You give more than the road returns. Far behind you, a family tears its last loaf unevenly so the youngest receives the larger piece. They cannot remember who taught them. They do it anyway.',
    retired: 'You choose a place to rest. The world remains short of bread and full of strangers. You set another place without asking whether it is deserved.',
  },
  'unsealed-book': {
    title: 'The Book Left Open',
    path: 'Honesty',
    opening: 'You have read names struck from ledgers and names never entered. The worst lies here rarely arrive shouting. They sit neatly in the blank space where an answer should be.',
    complete: 'The last gate falls behind you, but the accounts travel onward. You copy what you know for people who can check it, leaving room for what you cannot prove. A name returned to its family is not a life returned. You refuse to confuse the two.',
    fallen: 'You fall with questions unanswered. Pages pass from hand to hand afterward, some copied wrong. They are enough to make the next official open a locked drawer.',
    retired: 'You stop at a smaller gate and begin writing the names you know. The account is unfinished. At sunrise someone brings another name.',
  },
  'bell-again': {
    title: 'The Bell That Answers',
    path: 'Courage',
    opening: 'A bell rings after years of silence. It cannot undo the danger it announces. It only gives people a moment to decide whether to hide, run, or come out and help.',
    complete: 'Beyond the Verge you carry scars enough for a map. Witnesses tell different versions of your stand. All agree that when the warning sounded, you did not leave them alone to hear it.',
    fallen: 'You stand through one danger too many. The next traveler hears the bell and knows someone paid to make it ring. They choose their ground better.',
    retired: 'For once you hear the warning and step away. The bell rings without you. Courage was never a vow to stand at every gate until you fell.',
  },
  'unmarked-ford': {
    title: 'The Ford Without a Name',
    path: 'Cunning',
    opening: 'Every official road eventually acquires a gate, a toll, and someone ready to explain why it belongs to them. You read the tracks beneath those roads, where maps end and reeds begin.',
    complete: 'You take the last crossing no one thought to tax. Some call you a liberator; others call you a smuggler. You distrust any label that helps a collector find you.',
    fallen: 'The hidden path closes behind you. Someone finds your markings in the mud, mistakes one sign, and takes the long way home. You left clues, not explanations.',
    retired: 'You leave the last gate to its officials and disappear along a bank only fishermen remember. Your friends know where to find you. Your enemies keep paying to guess.',
  },
  'salt-crown': {
    title: 'The Crown Made of Salt',
    path: 'Ruthlessness',
    opening: 'You learned that a frightened person obeys faster than a persuaded one. The roads bear marks of that lesson: repaired fences, empty doorways, and places where people no longer ask for help.',
    complete: 'The last gate opens to you. Nobody pretends it is because you are welcome. You have the crossing and all the silence that comes with taking it. Salt preserves many things, including the taste of what you did.',
    fallen: 'At last someone refuses to move. The people you threatened do not gather to mourn. Another hard hand is already reaching for the gate.',
    retired: 'You withdraw with enough fear still attached to your name to clear a table. One evening someone invites you to sit without reaching for your weapon. You cannot tell whether it is sincere.',
  },
  'unnamed-road': {
    title: 'The Road No One Names',
    path: 'An unfinished account',
    opening: 'You have crossed a hundred bargains and come away with no single story large enough to hold them. Some days you helped, some days you hid, and some days you walked away before learning what happened next.',
    complete: 'The Verge opens onto another road, not a throne or verdict. You know the dust on your coat and where your feet still hurt. It is enough to take another step.',
    fallen: 'The journey stops before anyone decides what it meant. Someone remembers a stranger who came when needed and disappeared again. Even they are unsure it was you.',
    retired: 'You leave the unfinished road to its people. Some call it quitting, others envy the ability to turn around. The lands keep shifting, indifferent to either name.',
  },
}

const BLENDS: ReadonlyArray<{ kind: EndingKind; left: Mark; right: Mark }> = [
  { kind: 'shared-well', left: 'mercy', right: 'honesty' },
  { kind: 'open-door', left: 'mercy', right: 'courage' },
  { kind: 'masked-rule', left: 'cunning', right: 'ruthlessness' },
  { kind: 'scarred-witness', left: 'honesty', right: 'ruthlessness' },
]

const SINGLE: Record<Mark, EndingKind> = {
  mercy: 'last-loaf',
  honesty: 'unsealed-book',
  courage: 'bell-again',
  cunning: 'unmarked-ford',
  ruthlessness: 'salt-crown',
}

export function endingKindForMarks(marks: Readonly<Marks>): EndingKind {
  for (const blend of BLENDS) {
    const a = marks[blend.left]
    const b = marks[blend.right]
    if (
      a >= 2 &&
      b >= 2 &&
      Math.abs(a - b) <= 1 &&
      MARKS.every(
        (mark) =>
          mark === blend.left ||
          mark === blend.right ||
          marks[mark] < Math.min(a, b),
      )
    )
      return blend.kind
  }
  const leading = MARKS.reduce((best, mark) =>
    marks[mark] > marks[best] ? mark : best,
  )
  return marks[leading] >= 2 ? SINGLE[leading] : 'unnamed-road'
}

const DEEDS: ReadonlyArray<[string, string]> = [
  ['deed-kept-promise', 'Behind you, a promise still holds because you kept it when keeping it hurt.'],
  ['deed-shared-bread', 'There is a household where your bread was eaten before your name was learned.'],
  ['deed-spared-foe', 'Someone you could have hurt walks these roads. What they do with your mercy is not yours to decide.'],
  ['deed-left-someone', 'There is someone you left behind. The road offers no proof that help found them.'],
  ['deed-bloodied-hands', 'Someone remembers your hands before your face. That part of the story cannot be edited out.'],
  ['deed-marked-by-wardens', 'The wardens know your face. Every crossing after this will ask why.'],
]

const TRIALS: Record<string, Record<string, string>> = {
  homestead: {
    confront: 'At the Abbess’s door you turn the guards aside; the empty beds can no longer hide behind a welcome.',
    parley: 'At the Abbess’s door you bring witnesses, and shared bread becomes a demand for an accounting.',
    evidence: 'At the Abbess’s door your evidence opens a way past the locked wing.',
  },
  dustwater: {
    confront: 'At the Crossing Gate you raise the jammed weight and the stranded boats escape.',
    parley: 'At the Crossing Gate you put the bargain in writing before the keeper moves the winch.',
    evidence: 'At the Crossing Gate you follow a safe channel the toll book never mentions.',
  },
  tablelands: {
    confront: 'At the canyon you stand against the Warden on the ground he meant to control.',
    parley: 'At the canyon you ask the Warden for a bargain instead of an order.',
    evidence: 'At the canyon you put proof against the Warden’s version of events.',
  },
  cave: {
    confront: 'Below the hills you face the darkness without letting it name your price.',
    parley: 'Below the hills you find words enough to bargain before anyone draws a blade.',
    evidence: 'Below the hills you make the evidence from above answer the voices below.',
  },
  verge: {
    confront: 'At the last threshold you force open a passage built to keep strangers out.',
    parley: 'At the last threshold you bargain for terms another traveler may survive.',
    evidence: 'At the last threshold you make proof stronger than the rule against passage.',
  },
}

export function authoredEndingV6(
  state: JourneyStateV6,
  trials: readonly TrialResult[],
): AuthoredEndingV6 | null {
  const phase = state.journey.phase
  if (phase !== 'complete' && phase !== 'fallen' && phase !== 'retired')
    return null
  const kind = endingKindForMarks(state.marks)
  const copy = ENDINGS[kind]
  const paragraphs = [copy.opening, copy[phase as TerminalPhase]]
  const deed = DEEDS.find(([flag]) => state.flags.includes(flag))
  if (deed) paragraphs.push(deed[1])
  const successes = trials.filter((trial) => trial.roll.success)
  const remembered =
    [...successes].reverse().find((trial) => trial.choiceId === 'evidence') ??
    successes.at(-1) ??
    trials.at(-1)
  if (remembered) {
    if (remembered.roll.success) {
      const echo = TRIALS[remembered.landId]?.[remembered.choiceId]
      if (echo) paragraphs.push(echo)
    } else {
      paragraphs.push(
        'The last trial still holds its gate against you. You remember the attempt, not an invented victory.',
      )
    }
  }
  return { kind, title: copy.title, path: copy.path, paragraphs }
}
