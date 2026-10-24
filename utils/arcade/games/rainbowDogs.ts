// /utils/arcade/games/rainbowDogs.ts
//
// Rainbow Bullet Hell Space Princess, conductor rainbow t-037. Silas, 2026-10-23 PT: "the good team is
// "C.A.T.S.", the villains are DOGS." The princesses fly as C.A.T.S. (Cute And Tough Starfighters); the DOGS (who
// don't stand for anything, they're just dogs) snapped obedience collars on the sea fleet, and a DOG commander
// rides every boss machine. A commander barks one line as its boss arrives and gets sent home with "BAD DOG!" when
// it falls. They are cartoon-grumpy, never hurt (DOODLE-DIRECTION.md).

export const RAINBOW_SQUADRON = {
  name: 'C.A.T.S.',
  stands: 'Cute And Tough Starfighters',
} as const

export const RAINBOW_VILLAINS = 'DOGS'

export type RainbowDogCommander = {
  /** Shown on the boss bar under the machine's name. */
  name: string
  /** Barked as the boss arrives. */
  taunt: string
}

/** The commander riding each Act's boss machine (9 is the Eclipse Crown's King Rufus). */
export const RAINBOW_DOG_COMMANDERS: Readonly<
  Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, RainbowDogCommander>
> = {
  1: { name: 'CORPORAL CHIHUAHUA', taunt: 'YIP! Fetch them, seahorse!' },
  2: { name: 'PROFESSOR POODLE', taunt: 'My jellies obey my science!' },
  3: { name: 'SERGEANT BULLDOG', taunt: 'Grrr. I chewed the off switch.' },
  4: { name: 'THE DACHSHUND TWINS', taunt: 'Left hull! No, RIGHT hull!' },
  5: { name: 'ADMIRAL DOBERMAN', taunt: 'I have a medal for sitting!' },
  6: { name: 'CAPTAIN CORGI', taunt: 'This ray is MY size!' },
  7: { name: 'MIRROR MUTT', taunt: 'Which one of me is real? Woof.' },
  8: { name: 'GENERAL GREAT DANE', taunt: 'Ow, low ceiling. ATTACK!' },
  9: { name: 'KING RUFUS', taunt: 'The DOGS rule the sky! Sit! STAY!' },
}

/** The line every commander leaves on: the crew calls it, and the dog rockets home. */
export const RAINBOW_BAD_DOG = 'BAD DOG!'

/** Frames a commander's bark (or the BAD DOG! send-off) stays up. */
export const RAINBOW_BARK_FRAMES = 180
