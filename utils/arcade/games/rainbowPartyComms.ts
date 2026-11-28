/**
 * Authored party-set callbacks for the Crown Reef reveal and the ending. A mask identifies the actual princesses,
 * never their seat order.
 *
 * Independent story critic, 2026-11-23 PT: S5, each combination was one non-sequitur line naming things the story
 * never set up; S6, Vivi spoke for 8 of the 15 crews; S9, the middle seats barely spoke; S21, Solenne's solo
 * epilogue mourned cadets whether or not the crew brought them home. Now each crew answers Lilt's confession (the
 * Crown kept "protect" and erased "ask") in a three-line exchange among the pilots actually flying, built only on
 * what each pilot already is: Maribel the radio tinkerer, Azure the cartographer, Solenne the captain and secret
 * composer, Vivi the street-orchestra punk. A solo pilot trades lines with Lilt. Every pilot in a crew of two or
 * three speaks, and the epilogue is not always the reveal's first voice.
 */
export type RainbowPartyPilot = 'Maribel' | 'Azure' | 'Solenne' | 'Vivi'
export type RainbowPartyLine = {
  speaker: RainbowPartyPilot | 'Lilt-7'
  text: string
}
export type RainbowPartyTrack = {
  /** Three lines answering Lilt's confession in the Act VI reveal. */
  reveal: readonly [RainbowPartyLine, RainbowPartyLine, RainbowPartyLine]
  /** The crew's own line in the ending (rebel and unsworn roads). */
  epilogue: { speaker: RainbowPartyPilot; text: string }
}

export const RAINBOW_PARTY_TRACKS: Readonly<Record<number, RainbowPartyTrack>> =
  {
    1: {
      reveal: [
        {
          speaker: 'Maribel',
          text: "A radio that only transmits. I've wired one of those by mistake.",
        },
        { speaker: 'Lilt-7', text: 'How did you fix it?' },
        {
          speaker: 'Maribel',
          text: 'You open it up and teach it to listen. We can do that for the Crown.',
        },
      ],
      epilogue: {
        speaker: 'Maribel',
        text: 'The distress channel belongs to everyone now. No call disappears alone.',
      },
    },
    2: {
      reveal: [
        {
          speaker: 'Azure',
          text: 'So the Crown has flown a chart with one word scraped off. That explains the wrong turns.',
        },
        { speaker: 'Lilt-7', text: 'It was always the fastest route, Azure.' },
        {
          speaker: 'Azure',
          text: 'Fastest for the Crown. Nobody asked the people on it. I will redraw it with them.',
        },
      ],
      epilogue: {
        speaker: 'Azure',
        text: 'We redrew the rescue rule like a chart, with every voice we heard marked on it.',
      },
    },
    3: {
      reveal: [
        {
          speaker: 'Azure',
          text: 'You wrote the rule and watched them cut a word. Why tell us now?',
        },
        {
          speaker: 'Maribel',
          text: "Because she's asking, Azure. That's the missing word. We answer first.",
        },
        {
          speaker: 'Azure',
          text: 'Then I will chart the asks too. Every call, not only the fast ones.',
        },
      ],
      epilogue: {
        speaker: 'Azure',
        text: 'Our rescue atlas is open. Anyone can add a missing ship.',
      },
    },
    4: {
      reveal: [
        {
          speaker: 'Solenne',
          text: 'A captain who protects and never asks is just a wall. I was becoming one.',
        },
        {
          speaker: 'Lilt-7',
          text: 'You asked me to fly with you on the first day.',
        },
        {
          speaker: 'Solenne',
          text: 'Then I will write the rule back like a song: the whole verse, ask and all.',
        },
      ],
      epilogue: {
        speaker: 'Solenne',
        text: 'I set the rescue rule to music, ask and all. Every squadron can sing it.',
      },
    },
    5: {
      reveal: [
        {
          speaker: 'Solenne',
          text: 'I have given orders across this whole Ocean. Did I ever once ask?',
        },
        {
          speaker: 'Maribel',
          text: 'You asked me to fly with you. Start there, Captain.',
        },
        {
          speaker: 'Solenne',
          text: 'And you call for backup when you need it. That is the deal.',
        },
      ],
      epilogue: {
        speaker: 'Maribel',
        text: 'Our rescue corps has no throne. Every squadron has a vote.',
      },
    },
    6: {
      reveal: [
        {
          speaker: 'Azure',
          text: "A rule without its ask is a map without testimony. I've drawn a few of those.",
        },
        {
          speaker: 'Solenne',
          text: 'And I gave the orders that followed them. We share the pen from here.',
        },
        {
          speaker: 'Azure',
          text: 'You hold the sectors, I chart them, and we ask before we draw a line.',
        },
      ],
      epilogue: {
        speaker: 'Solenne',
        text: 'Every rescue chart we file now starts with a question, not an order.',
      },
    },
    7: {
      reveal: [
        {
          speaker: 'Solenne',
          text: 'So the Crown protects like a captain who never listens.',
        },
        {
          speaker: 'Azure',
          text: 'Or a map that nobody is allowed to correct.',
        },
        {
          speaker: 'Maribel',
          text: "Or a radio that can't receive. Good thing the three of us fix things.",
        },
      ],
      epilogue: {
        speaker: 'Azure',
        text: 'Our rescue council shares the veto. No life is a rounding error.',
      },
    },
    8: {
      reveal: [
        {
          speaker: 'Vivi',
          text: "Protect, no ask? That's a solo where the band never got a vote.",
        },
        {
          speaker: 'Lilt-7',
          text: 'I wrote the first verse. I let them cut the chorus.',
        },
        {
          speaker: 'Vivi',
          text: 'Then we play it loud with the chorus back in, and everybody sings.',
        },
      ],
      epilogue: {
        speaker: 'Vivi',
        text: 'We put the chorus back in. Now the whole Ocean sings it, and nobody plays solo.',
      },
    },
    9: {
      reveal: [
        {
          speaker: 'Vivi',
          text: "They kept protect and cut ask? That's a cover band that lost the words.",
        },
        {
          speaker: 'Maribel',
          text: 'Then we tune the channel back and let the Ocean sing its own part.',
        },
        {
          speaker: 'Vivi',
          text: "You fix the radio, I'll bring the noise. Together it's a song.",
        },
      ],
      epilogue: {
        speaker: 'Maribel',
        text: 'Our repaired transmitter plays a welcome across the whole Ocean.',
      },
    },
    10: {
      reveal: [
        {
          speaker: 'Azure',
          text: 'My routes were all correct and still wrong. I never asked who was on them.',
        },
        {
          speaker: 'Vivi',
          text: "That's why the reef sounds off-key. Listen, Azure. The answer's in the noise.",
        },
        {
          speaker: 'Azure',
          text: 'Then play it again. I will map what the reef is telling us.',
        },
      ],
      epilogue: {
        speaker: 'Azure',
        text: 'Our sound-map is on every chart now. Reef guides find safe water by ear.',
      },
    },
    11: {
      reveal: [
        {
          speaker: 'Maribel',
          text: "Protect without ask. That's how a rescue turns into a cage.",
        },
        {
          speaker: 'Azure',
          text: 'And every chart it drew made the cage look like safe water.',
        },
        {
          speaker: 'Vivi',
          text: 'So we break it open loud enough that nobody forgets the word again.',
        },
      ],
      epilogue: {
        speaker: 'Maribel',
        text: "We put 'ask' back into every chart, every channel and every song.",
      },
    },
    12: {
      reveal: [
        {
          speaker: 'Solenne',
          text: 'I write my music in secret so no one can ask me to change it. That sounds familiar.',
        },
        {
          speaker: 'Vivi',
          text: 'Then play it in public, Solenne. Shared songs get better.',
        },
        {
          speaker: 'Solenne',
          text: 'Two melodies, one rescue cadence. All right. Count us in.',
        },
      ],
      epilogue: {
        speaker: 'Solenne',
        text: 'Our peace concert has two conductors and a whole fleet singing.',
      },
    },
    13: {
      reveal: [
        {
          speaker: 'Vivi',
          text: 'Protect, never ask. That is how they kept every evacuation quiet.',
        },
        {
          speaker: 'Solenne',
          text: 'Then we move people first and let them decide where they go.',
        },
        {
          speaker: 'Maribel',
          text: 'And I keep a channel open so they can answer back.',
        },
      ],
      epilogue: {
        speaker: 'Vivi',
        text: 'The evacuation network answers to civilians, not admirals.',
      },
    },
    14: {
      reveal: [
        {
          speaker: 'Azure',
          text: 'There is a route the Crown never charted, because it never asked anyone.',
        },
        {
          speaker: 'Solenne',
          text: 'Then we ask. I will hold the sectors while you two find it.',
        },
        {
          speaker: 'Vivi',
          text: 'And when we do, the whole fleet hears who found it. Everybody.',
        },
      ],
      epilogue: {
        speaker: 'Azure',
        text: 'Our map changes with every voice that finds a safer path.',
      },
    },
    15: {
      reveal: [
        {
          speaker: 'Azure',
          text: "Every route I charted started from protect. I'm adding ask to all of them.",
        },
        {
          speaker: 'Solenne',
          text: 'And I will stop giving orders long enough to hear the answers.',
        },
        {
          speaker: 'Vivi',
          text: 'The first command was to ask. We heard it together. Now we get to choose.',
        },
      ],
      epilogue: {
        speaker: 'Maribel',
        text: 'We wrote the rule together: ask, rescue, and never erase a name.',
      },
    },
  }

/** The four canonical pilot indices become a stable 4-bit set (1..15). */
export function rainbowPartyMask(pilots: readonly number[]): number {
  if (pilots.length < 1 || pilots.length > 4) {
    throw new Error('A C.A.T.S. crew must have one to four pilots')
  }
  let mask = 0
  for (const pilot of pilots) {
    if (!Number.isInteger(pilot) || pilot < 0 || pilot > 3) {
      throw new Error('Unknown C.A.T.S. pilot')
    }
    const bit = 1 << pilot
    if (mask & bit) throw new Error('Duplicate C.A.T.S. pilot')
    mask |= bit
  }
  return mask
}

export function rainbowPartyTrack(mask: number): RainbowPartyTrack {
  const track = RAINBOW_PARTY_TRACKS[mask]
  if (!Number.isInteger(mask) || !track) {
    throw new Error('Unwritten C.A.T.S. pilot combination')
  }
  return track
}
