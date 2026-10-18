// /utils/arcade/games/rainbowActBeats.ts
//
// Acts II-VIII after Silas's playtest (conductor rainbow t-023; Act I's own are in rainbowPinkwake): Lilt calls
// out every section as it begins, with a pilot's reply (solo lines included), so no stretch of an Act goes quiet,
// and each Act has a stretch of terrain to weave through, the coral-spire rules in the Act's own look: the
// Moonjelly tendrils, trench rock, rail pylons, wreck girders, reef coral, glass shards and the palace's heart
// spires. Callouts give way to an Act's own scripted scenes; terrain rises only inside its authored section.

type Section = { name: string; from: number; to: number }
export type ActBeatAct = 2 | 3 | 4 | 5 | 6 | 7 | 8

/** Lilt's line, then the reply flown solo, then the reply in co-op (from the last seat's pilot). */
type Callout = readonly [lilt: string, solo: string, coop: string]

export const ACT_CALLOUTS: Record<
  ActBeatAct,
  Readonly<Record<string, Callout>>
> = {
  2: {
    'Relay links': [
      'Relay craft fire in linked pairs. Break one and the link drops.',
      'Copy. Cut the chain, not the colony.',
      'Take the left link. I have the right.',
    ],
    'Skimmer rain': [
      'Skimmers are dropping bead rain from above. Read the drops, not the ships.',
      'Eyes up. Got it.',
      'Watch the ceiling, all of you.',
    ],
    'Coral cover': [
      'Coral walls ahead. They break, but they hold a while: shoot the lane open.',
      'Making a door.',
      'I will open the wall. Cover me.',
    ],
    'Lantern guardian': [
      'Big lantern incoming. Its fans leave the lane at you open: stay in it.',
      'Holding the open lane.',
      'Into its blind lane, together.',
    ],
    'Tendril maze': [
      'Jelly tendrils hang into the current. They sting: fly between them.',
      'Threading the tendrils.',
      'Single file between the tendrils.',
    ],
    'Colony wake': [
      'The Aurelia Array is gathering its colony. One more school, then the Array.',
      'Ready when it is.',
      'Shields up. Here comes the Array.',
    ],
  },
  3: {
    'Bubble pockets': [
      'Pistol shuttles lob bubbles that burst into rings. Keep clear of the edge.',
      'Bubbles. Lovely. Popping them early.',
      'Do not let a bubble ripen near you.',
    ],
    'Angler lights': [
      'Anglers drop false pickups. If it flashes a cross, it is a trap.',
      'Not falling for that twice.',
      'Nobody touch the pretty lights.',
    ],
    'Glass skates': [
      'Skate pellets glance off the trench wall once. Read the angle.',
      'Bank shot. Noted.',
      'Mind the walls: they shoot back.',
    ],
    'Clawstrike guardian': [
      'The Clawstrike guardian marks its lanes. Sit between the marks.',
      'Between the lines. Easy.',
      'Spread out between the marks.',
    ],
    'Crossfire ridge': [
      'Vault route. Crossfire on both walls: this is where the salvage is.',
      'High road it is.',
      'High road. Stay tight.',
    ],
    'Bubble garden': [
      'Bubble garden. The vault doors are just beyond it.',
      'Almost there.',
      'Clear the garden, then the vault.',
    ],
    'Winding passage': [
      'Safe passage. Lighter fire, and a shield repair at the end.',
      'Quiet is good.',
      'Breathe while we can.',
    ],
    'Coral shelf': [
      'Coral shelf. Stay low; the routes meet again ahead.',
      'Following the shelf.',
      'Low and steady.',
    ],
    'Vault gate': [
      'Trench rock ahead, and the Clawburst behind it. Weave, then fight.',
      'Weave, then fight. Got it.',
      'Through the rocks, then the claw.',
    ],
  },
  4: {
    'Dolphin pairs': [
      'Dolphin craft dive across each other, then hang dizzy. Hit them dizzy.',
      'Wait for the dizzy.',
      'Let them cross, then strike.',
    ],
    'Courier lanes': [
      'Couriers flicker before they dash and drop a mine. Watch the cargo light.',
      'Watching the lights.',
      'Call the flickers out loud.',
    ],
    'Eel gates': [
      'Eels light a barrier. Only the bright ends take damage: go round.',
      'Round the ends.',
      'Ends only. Around, not through.',
    ],
    'Courier guardian': [
      'Courier guardian. Its cargo mines burst into rings: leave room.',
      'Room to breathe. Got it.',
      'Spread out. Give the rings room.',
    ],
    'Convoy escort': [
      'A civilian pod is riding the rails. Keep the dolphins off it.',
      'Shielding the pod.',
      'Two on the pod, the rest on the dolphins.',
    ],
    'Surge rails': [
      'The current surges, and rail pylons stand in the lanes. Weave them fast.',
      'Fast and weaving. My favourite.',
      'Ride the surge, mind the pylons.',
    ],
    'Terminus rails': [
      'Terminus ahead. Delphion is waiting at the end of the line.',
      'End of the line for them, then.',
      'Last stop. Ready up.',
    ],
  },
  5: {
    'Hammerhead pods': [
      'Hammerheads launch missiles from their fin pods. Knock the pods off first.',
      'Pods first.',
      'Aim for the fins.',
    ],
    'Salvager arms': [
      'Salvagers grab pickups and fire along their arms. Hit them while they reach.',
      'Hit them mid-grab.',
      'Jam their grabs.',
    ],
    'Scrap field': [
      'Scrap slabs soak every shot. Go around them.',
      'Around the junk.',
      'Do not waste shots on scrap.',
    ],
    'Salvager guardian': [
      'Salvager guardian. Its arms turn every volley: read the diagonals.',
      'Reading the arms.',
      'Watch the diagonals, everyone.',
    ],
    'Petal hulls': [
      'Wreck girders across the yard. Weave them; they will not move for us.',
      'Neither will I.',
      'Through the girders, careful.',
    ],
    'Depot or armory': [
      'The yard splits. High frees the depot survivors; low raids the armory.',
      'Choosing now.',
      'Pick a lane together.',
    ],
    "Regent's wake": [
      'The Sawtooth Regent is surfacing. Last escort first.',
      'Clearing the escort.',
      'Escort first, then the Regent.',
    ],
  },
  6: {
    'Petal turrets': [
      'Petal turrets fire five-petal barrages. Break the stem: it takes double.',
      'Going for the stems.',
      'Stems, not petals.',
    ],
    'Bulwark shells': [
      'Bulwarks hide in shells and only open to fire. Hit them open.',
      'Patience, then pain.',
      'Wait for the shell to open.',
    ],
    'Reef gate': [
      'Reef gates close the lanes. Find the open one.',
      'Finding it.',
      'Follow me through the gate.',
    ],
    'Bulwark guardian': [
      'Bulwark guardian sweeps its fan one way, then back. Move against it.',
      'Against the sweep.',
      'Read the sweep, then cross.',
    ],
    'Relay or cache': [
      'The reef forks. High breaks the relay pylons; low takes the cache.',
      'Choosing now.',
      'Together on this one.',
    ],
    'Nursery approach': [
      'Reef coral closes in before the nursery. Weave it, then the Lantern Ray.',
      'Weaving.',
      'Through the coral, then the Ray.',
    ],
  },
  7: {
    'Split lenses': [
      'Crystal squids fire lens pellets that split in three. Back off before they split.',
      'Giving them room.',
      'Back off the lenses.',
    ],
    'Harbinger glass': [
      'Harbingers remix old patterns: a lane bolt, then a ring bubble.',
      'I know those patterns.',
      'We have seen these. Stay sharp.',
    ],
    'Prism pylons': [
      'Prism pylons fire refracted fans on a rhythm. Count the beat.',
      'Counting.',
      'On the beat, move.',
    ],
    'Mirror guardian': [
      'Mirror guardian. Half its fan is phantom light: read the solid pellets.',
      'Solid ones only.',
      'Ignore the ghosts.',
    ],
    'Palace corridor': [
      'Glass shards fill the corridor to the palace. Weave them, then the Glass Eel.',
      'Weaving the glass.',
      'Through the shards, together.',
    ],
  },
  8: {
    'Captive armada': [
      'Captive whales, collared. Break the collars, never the hulls.',
      'Collars only.',
      'Free them. Collars only.',
    ],
    'Lantern hall': [
      'Old lantern craft from Moonjelly, under the Crown now.',
      'We have freed these before.',
      'We know their gaps.',
    ],
    'Trench echoes': [
      'Trench snipers and pistols, echoing the old routes.',
      'I remember the trench.',
      'Watch for the marked lanes.',
    ],
    'Herald guardian': [
      'Herald guardian: bolts down marked lanes, then a gapped ring.',
      'Lanes, then ring.',
      'Between the marks, then find the gap.',
    ],
    'Last captives': [
      'The last of the armada. Free as many as you can reach.',
      'Every one I can.',
      'Spread out and free them.',
    ],
    'Core approach': [
      'Heart spires rise toward the core. Weave them; the Leviathan waits below.',
      'Weaving to the heart.',
      'Through the spires, together.',
    ],
  },
}

/** The callouts last two lines' worth of frames. */
export const CALLOUT_LINE_FRAMES = 96

/**
 * Lilt's callout for this Act frame, if a section began within the last two lines: Lilt first, then the reply,
 * from the lead pilot flown solo or the last seat's pilot in co-op.
 */
export function actCallout(
  act: ActBeatAct,
  sections: readonly Section[],
  frame: number,
  players: number,
): { id: string; speaker: string; text: string } | null {
  const pilots = ['Maribel', 'Azure', 'Solenne', 'Vivi'].slice(
    0,
    Math.max(1, Math.min(4, players)),
  )
  for (const section of sections) {
    const callout = ACT_CALLOUTS[act][section.name]
    if (!callout) continue
    const elapsed = frame - section.from
    if (elapsed < 0 || elapsed >= 2 * CALLOUT_LINE_FRAMES) continue
    const id = `A0${act}.CALL`
    if (elapsed < CALLOUT_LINE_FRAMES)
      return { id, speaker: 'Lilt-7', text: callout[0] }
    return pilots.length === 1
      ? { id, speaker: pilots[0]!, text: callout[1] }
      : { id, speaker: pilots.at(-1)!, text: callout[2] }
  }
  return null
}

/** Each Act's terrain section and how its spires stand: alternating to weave, or a looser scatter. */
export const ACT_TERRAIN: Record<
  ActBeatAct,
  { section: string; name: string; weave: boolean }
> = {
  2: { section: 'Tendril maze', name: 'jelly tendrils', weave: true },
  3: { section: 'Vault gate', name: 'trench rock', weave: true },
  4: { section: 'Surge rails', name: 'rail pylons', weave: false },
  5: { section: 'Petal hulls', name: 'wreck girders', weave: true },
  6: { section: 'Nursery approach', name: 'reef coral', weave: true },
  7: { section: 'Palace corridor', name: 'glass shards', weave: true },
  8: { section: 'Core approach', name: 'heart spires', weave: true },
}

/** How an Act's terrain (Act I's coral spires included) is painted: the body's edge and middle, its rim, its knobs and its glowing tip. */
export const ACT_TERRAIN_PALETTE: Record<
  1 | ActBeatAct,
  { edge: string; middle: string; rim: string; knob: string; tip: string }
> = {
  1: {
    edge: '#3d1a52',
    middle: '#b04e8e',
    rim: '#ffc6e6',
    knob: '#ff9fd8',
    tip: '#ffe6f6',
  },
  2: {
    edge: '#1d3b5a',
    middle: '#5fb6d8',
    rim: '#c8f4ff',
    knob: '#aef6f0',
    tip: '#eafcff',
  },
  3: {
    edge: '#1a1230',
    middle: '#5a3f7a',
    rim: '#c9b3ff',
    knob: '#8f7ac2',
    tip: '#ffd0a8',
  },
  4: {
    edge: '#2a1840',
    middle: '#c06a9a',
    rim: '#ffd2ef',
    knob: '#ffb3e0',
    tip: '#fff2a8',
  },
  5: {
    edge: '#2a1a14',
    middle: '#7a5a3e',
    rim: '#e8c6a0',
    knob: '#b98a5e',
    tip: '#ffb38a',
  },
  6: {
    edge: '#3a1a10',
    middle: '#c97a3e',
    rim: '#ffd8a8',
    knob: '#ff9f6a',
    tip: '#fff0c8',
  },
  7: {
    edge: '#16304a',
    middle: '#9fd8ff',
    rim: '#f0faff',
    knob: '#c4e8ff',
    tip: '#ffffff',
  },
  8: {
    edge: '#2a0a3a',
    middle: '#8a3a7a',
    rim: '#ff9fd8',
    knob: '#ff6ab0',
    tip: '#fff2fa',
  },
}

/** Spires keep this long apart, and a weave leaves this little room on its open side. */
const TERRAIN = {
  first: 150,
  every: 165,
  weaveTip: 0.6,
  looseTip: 0.36,
} as const

/** The terrain that rises on this Act frame: tips as lanes (0 top, 1 bottom), hanging or standing. */
export function actTerrain(
  act: ActBeatAct,
  sections: readonly Section[],
  frame: number,
): ReadonlyArray<{ top: boolean; tip: number }> {
  const terrain = ACT_TERRAIN[act]
  const section = sections.find((s) => s.name === terrain.section)
  if (!section) return []
  const offset = frame - section.from - TERRAIN.first
  if (offset < 0 || offset % TERRAIN.every !== 0) return []
  const index = offset / TERRAIN.every
  // Leave the section's last few seconds clear, so nothing stands in the way of what follows.
  if (frame > section.to - 300) return []
  const top = index % 2 === 0
  const tip = terrain.weave
    ? top
      ? TERRAIN.weaveTip
      : 1 - TERRAIN.weaveTip
    : top
      ? TERRAIN.looseTip
      : 1 - TERRAIN.looseTip
  return [{ top, tip }]
}
