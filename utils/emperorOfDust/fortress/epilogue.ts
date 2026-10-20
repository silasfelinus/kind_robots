import type { Mood } from './castArt'
import type { EndingId } from './endings'
import type { FortressRun } from './types'

// "Afterwards": the consequences epilogue after Day 50 (conductor GAME-BIBLE
// "Day 100 resolves an ending and a consequences epilogue"). Each subject is
// someone or something the emperor touched; its first variant whose condition
// holds is told, and a subject with no matching variant is left out. Variants
// read the flags the run left behind, so the wasteland remembers what was done.

export type EpilogueCondition = {
  /** All of these flags were set. */
  flags?: string[]
  /** At least one of these flags was set. */
  anyFlags?: string[]
  /** None of these flags were set. */
  notFlags?: string[]
  endings?: EndingId[]
  /** These followers joined and lived to the end. */
  alive?: string[]
  /** These followers died. */
  dead?: string[]
}

export type EpilogueVariant = {
  when?: EpilogueCondition
  text: string
  mood?: Mood
}

export type EpilogueSubject = {
  id: string
  name: string
  /** Major NPC slug, for illustrated art. */
  npc?: string
  /** A follower: told only if they ever joined this run. */
  follower?: string
  variants: EpilogueVariant[]
}

export type EpilogueEntry = {
  subject: EpilogueSubject
  variant: EpilogueVariant
}

const joined = (run: FortressRun, id: string) =>
  run.roster.some((state) => state.id === id)
const diedIn = (run: FortressRun, id: string) =>
  run.roster.some((state) => state.id === id && state.dead)

export const conditionHolds = (
  run: FortressRun,
  ending: EndingId,
  when: EpilogueCondition | undefined,
): boolean => {
  if (!when) return true
  const has = (flag: string) => run.flags.includes(flag)
  return (
    (when.flags ?? []).every(has) &&
    (!when.anyFlags?.length || when.anyFlags.some(has)) &&
    !(when.notFlags ?? []).some(has) &&
    (!when.endings?.length || when.endings.includes(ending)) &&
    (when.alive ?? []).every((id) => joined(run, id) && !diedIn(run, id)) &&
    (when.dead ?? []).every((id) => diedIn(run, id))
  )
}

export const EPILOGUE: readonly EpilogueSubject[] = [
  {
    id: 'mara',
    name: 'Mara Reedbell',
    npc: 'mara-reedbell',
    variants: [
      {
        when: { endings: ['bell-restored'], flags: ['mara-millers-levy'] },
        mood: 'happy',
        text: 'Mara Reedbell kept the mayor’s chain for nine more years. The mill families never forgave the levy, and never quite worked out that it was hers. On the day the Bell rang again she stood under it with her ledger shut, and for once she did not count anything.',
      },
      {
        when: { flags: ['mara-millers-levy'] },
        text: 'The mill families voted Mara Reedbell out the following spring, as she always said they would. She took a room above the chandler’s and went on writing letters to the crown, very long and very polite, signed simply “a resident”.',
      },
      {
        when: { flags: ['chose:d01-aqueduct:levy'] },
        mood: 'sad',
        text: 'Hollow Bell paid, and Hollow Bell remembered paying. Mara Reedbell kept her chain and her smile, and her ledgers grew a second column that she never showed anyone, headed in small neat letters: “what the crown cost us”.',
      },
      {
        text: 'Mara Reedbell went on running Hollow Bell the way she always had, one compromise at a time, smiling until the ledger closed.',
      },
    ],
  },
  {
    id: 'fen-lanterns',
    name: 'The lanterns on the Mirefen road',
    npc: 'sister-reedlight',
    variants: [
      {
        when: { flags: ['mire-road-closed'] },
        mood: 'angry',
        text: 'Forty-one lanterns turned back into the fen on the emperor’s first night. Sister Reedlight never mentioned them again, not once, not even when it would have won her an argument. In the Mirefen they still put out a dark lantern on that night every year, and they will not say for whom.',
      },
      {
        when: { flags: ['mire-quiet-count'] },
        text: 'The court’s quiet count of the fen road was filed in the Lamplight Archive under “travellers, Mirefen, uncertain”. Every keeper who has read it since has added a note in the margin, and no two notes agree.',
      },
      {
        text: 'The lanterns reached the far side of the Mirefen road. Nobody at court ever learned what burned in them, and after a while nobody thought to ask.',
      },
    ],
  },
  {
    id: 'rook',
    name: 'Rook Bramble',
    follower: 'F001',
    variants: [
      {
        when: { dead: ['F001'] },
        mood: 'sad',
        text: 'Rook Bramble is buried at the Eastern Ford, facing the southern road. Someone leaves a painted feather on the stone every spring. Nobody at court has ever seen who.',
      },
      {
        when: { flags: ['romance-rook'] },
        mood: 'happy',
        text: 'Rook Bramble still keeps two cups on the barracks roof. They name the stars after roads they have ridden with the emperor, and get most of them wrong on purpose, and the emperor still notices.',
      },
      {
        when: { flags: ['rook-spare-scout'] },
        text: 'Rook never found the scout who pulled their family out of the Ford. They stopped looking for her face on painted wagons sometime in the second winter, and started looking at the road ahead instead.',
      },
      {
        text: 'Rook Bramble rode for the crown until the roads were quiet, and then for a while after, because they had grown used to it.',
      },
    ],
  },
]

/** The epilogue for a finished run, in authored order. */
export const epilogueFor = (
  run: FortressRun,
  ending: EndingId,
): EpilogueEntry[] =>
  EPILOGUE.flatMap((subject) => {
    if (subject.follower && !joined(run, subject.follower)) return []
    const variant = subject.variants.find((entry) =>
      conditionHolds(run, ending, entry.when),
    )
    return variant ? [{ subject, variant }] : []
  })
