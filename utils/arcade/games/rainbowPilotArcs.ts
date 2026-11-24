import type { RainbowPilot } from './rainbowPilots'

/**
 * Each pilot's own arc through the eight Acts (independent story critic, 2026-11-23 PT: S8, the princesses were
 * interchangeable in the Acts, and their hooks had no beats; S9, middle seats in three- and four-pilot crews barely
 * spoke). After each Act's three aftermath lines, one pilot speaks a line only she would say, carrying her hook:
 * Maribel answers every call alone and learns to call for backup; Azure plots the fastest route and learns to hear
 * testimony; Solenne carries the squadron and learns to share it (and her music); Vivi chases the top of the board
 * and learns that shared credit counts. A solo pilot hears her whole arc; in a crew the beat moves through the
 * seats Act by Act, so every pilot gets her say. Act VIII closes each arc before the finale.
 */
export const RAINBOW_PILOT_ARCS: Readonly<
  Record<RainbowPilot['key'], readonly string[]>
> = {
  maribel: [
    "Every call out here is mine to answer. I've got this one, Lilt. I've got all of them.",
    'I answered that lullaby alone and nearly flew into the colony. Next time I say so first.',
    'That pilot called for help and nobody came. I know how that feels from the other side.',
    "Lilt, I'm calling it: I need cover on the rails. See? I can ask.",
    "I kept those depot calls to myself too long. I'm sharing the channel from now on.",
    "Lilt asked first. So will I. Backup isn't weakness, it's the rule.",
    'I called for backup three times today and nobody laughed. Good to know.',
    "Every call I answer now, I answer with someone. Let's bring the whale fleet home.",
  ],
  azure: [
    "Fastest route through the wake is plotted. Command's chart has no notes on who lives here.",
    'My chart said hostile colony. The lullaby says nursery. Charts can be wrong.',
    "The quickest line to Clawburst ran over its pilot. I'm adding witnesses to my charts.",
    "The dolphins showed me a slower lane. Nobody got hurt in it. I'm keeping it.",
    'I asked the depot crew where the safe water is. Their answer beat my chart.',
    "A chart is just testimony someone wrote down. I want everyone's on mine.",
    "The navigator's beacon was never on any map. I heard it, then I drew it.",
    "Every route I draw now starts with who asked for it. Let's map the way out.",
  ],
  solenne: [
    "Formation tight. If anyone takes a hit, it's me. That's what a captain is for.",
    "I wrote a melody for that lullaby last night. I haven't shown anyone. Not yet.",
    "I've been carrying every decision alone. Somebody check my math, please.",
    'I handed the rails to my wing and it went better. I hate that. I love that.',
    "We mourn these ships together. I'm not holding this one by myself.",
    'I shared my song on open comms. Half the reef hummed it back.',
    'My shields hold better when someone else is holding the line too.',
    "This is not my squadron. It's ours. Take the lead whenever you need it.",
  ],
  vivi: [
    'First clear is mine! Put my name at the top of the board, Lilt.',
    "That lullaby beat my best solo, and I didn't even write it. Weird feeling.",
    "Clawburst's pilot flew better than me today. Put that on the board instead.",
    'The dolphins did the hard part. Credit them, not me. I mean it. Mostly.',
    'Those caretakers kept this depot alive for years. They get the headline.',
    'The nursery opened because someone asked. No solo for that, just a chorus.',
    'The Glass Eel was a prisoner too. Its freedom is the headline, not my score.',
    "Medals? Give them to every name we pulled out of this palace. I'm good.",
  ],
}

/** Which seat speaks the Act's arc beat: it moves through the crew Act by Act. */
export function rainbowArcSeat(act: number, players: number): number {
  return (act - 1) % Math.max(1, players)
}

/** The arc beat for this pilot after Act `act` (1-8), or null outside the eight Acts. */
export function rainbowPilotArcBeat(
  act: number,
  pilot: RainbowPilot['key'],
): string | null {
  return RAINBOW_PILOT_ARCS[pilot]?.[act - 1] ?? null
}
