/** Authored party-set callbacks for the Crown Reef reveal and the ending.
 * A mask identifies the actual princesses, never their seat order.
 * Every entry is a distinct exchange, not a four-player script with names swapped.
 */
export type RainbowPartyTrack = {
  speaker: 'Maribel' | 'Azure' | 'Solenne' | 'Vivi'
  reveal: string
  epilogue: string
}

export const RAINBOW_PARTY_TRACKS: Readonly<Record<number, RainbowPartyTrack>> =
  {
    1: {
      speaker: 'Maribel',
      reveal:
        "That rescue call in your glass still has a sender. I'm going to find them.",
      epilogue:
        'The distress channel belongs to everyone now. No call disappears alone.',
    },
    2: {
      speaker: 'Azure',
      reveal:
        'That coordinate is forged. You saved the old chart. Let me plot the truth.',
      epilogue:
        'The original chart is public, with every false coordinate marked.',
    },
    3: {
      speaker: 'Azure',
      reveal:
        'The lost ship in that call is the hole in our chart. We can follow both.',
      epilogue: 'Our rescue atlas is open. Anyone can add a missing ship.',
    },
    4: {
      speaker: 'Solenne',
      reveal:
        'Your error chime is an old rescue song. I remember who taught it.',
      epilogue: 'We held a concert for the cadets who never made it home.',
    },
    5: {
      speaker: 'Solenne',
      reveal:
        'You cannot command every rescue alone. Share the helm. I will hold the line.',
      epilogue: 'Our rescue corps has no throne. Every squadron has a vote.',
    },
    6: {
      speaker: 'Solenne',
      reveal:
        'Those academy records were edited. The cadets deserved the whole truth.',
      epilogue:
        'Every cadet can read the new safety charter. Nobody can erase it.',
    },
    7: {
      speaker: 'Solenne',
      reveal:
        'The convoy is fading. We need a rescue council, not one voice giving orders.',
      epilogue:
        'Our rescue council shares the veto. No life is a rounding error.',
    },
    8: {
      speaker: 'Vivi',
      reveal: "That's not a wrong note. It's a distress call with a heartbeat.",
      epilogue: 'I broadcast the names, not the ranks. The galaxy heard them.',
    },
    9: {
      speaker: 'Vivi',
      reveal:
        'That old radio duet is inside the Crown static. We used to sing it.',
      epilogue:
        'Our repaired transmitter plays a welcome across the whole Ocean.',
    },
    10: {
      speaker: 'Vivi',
      reveal:
        'My melody found the path your equations missed. Listen to the reef.',
      epilogue: 'The reef guides can hear our sound-map and find safe water.',
    },
    11: {
      speaker: 'Vivi',
      reveal:
        'The radio, the map, the song: that lost starport finally has a name.',
      epilogue: "We restored the starport's real name to every chart.",
    },
    12: {
      speaker: 'Vivi',
      reveal:
        'Two melodies, one rescue cadence. The whole fleet can hear us now.',
      epilogue:
        'Our peace concert has two conductors and a whole fleet singing.',
    },
    13: {
      speaker: 'Vivi',
      reveal:
        'Evacuate first, broadcast next. Let the people decide, not the ranks.',
      epilogue: 'The evacuation network answers to civilians, not admirals.',
    },
    14: {
      speaker: 'Vivi',
      reveal:
        'We found a hidden route through the Eclipse. Let the fleet help chart it.',
      epilogue: 'Our map changes with every voice that finds a safer path.',
    },
    15: {
      speaker: 'Vivi',
      reveal:
        'The first command was to ask. We heard it together. Now we get to choose.',
      epilogue:
        'We wrote the rule together: ask, rescue, and never erase a name.',
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
