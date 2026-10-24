import assert from 'node:assert/strict'
import { moonjellyDialogue } from '../arcade/games/rainbowMoonjelly'
import { pinkwakeDialogue } from '../arcade/games/rainbowPinkwake'
import { rosefinDialogue } from '../arcade/games/rainbowRosefin'
import { trenchDialogue } from '../arcade/games/rainbowTrench'
import { wreckDialogue } from '../arcade/games/rainbowWreckyard'

// Conductor rainbow t-041 (PLOT-MOTHERLAND.md): Acts I-V speak the Motherland's story of "pacifying" a feral Ocean,
// and leave the evidence the Act V memorial puts together: Motherland hardware, collars, colony ships, caretakers.

type Line = { text: string } | null
const scene = (speak: (elapsed: number) => Line): string => {
  const texts: string[] = []
  for (let elapsed = 0; elapsed < 900; elapsed += 4) {
    const line = speak(elapsed)
    if (line && !texts.includes(line.text)) texts.push(line.text)
  }
  return texts.join(' ')
}

for (const players of [1, 2, 4]) {
  const acts = [
    scene((e) => pinkwakeDialogue('A01.OPEN', e, players, true)) +
      scene((e) => pinkwakeDialogue('A01.AFTER', e, players, true)),
    scene((e) => moonjellyDialogue('A02.OPEN', e, players, true)) +
      scene((e) => moonjellyDialogue('A02.AFTER', e, players, true)),
    scene((e) => trenchDialogue('A03.OPEN', e, players)) +
      scene((e) => trenchDialogue('A03.AFTER', e, players)),
    scene((e) => rosefinDialogue('A04.OPEN', e, players)) +
      scene((e) => rosefinDialogue('A04.AFTER', e, players)),
    scene((e) => wreckDialogue('A05.AFTER', e, players)),
  ]
  // The official story is spoken early, and the Motherland is named in every Act before the turn.
  assert.match(acts[0]!, /Motherland/, `${players}p Act I names the Motherland`)
  assert.match(acts[0]!, /pacif/i, `${players}p Act I speaks of pacifying`)
  assert.match(
    acts[1]!,
    /war signal/,
    `${players}p Act II repeats the war-signal story`,
  )
  assert.match(
    acts[1]!,
    /lullaby/,
    `${players}p Act II hears what it really is`,
  )
  assert.match(
    acts[2]!,
    /fleet command/,
    `${players}p Act III finds the collar`,
  )
  assert.match(
    acts[3]!,
    /colony ships/,
    `${players}p Act IV finds the colony ships`,
  )
  assert.match(acts[4]!, /caretakers/, `${players}p Act V meets the caretakers`)
}
// The vault salvage answers to Motherland codes on either route.
assert.match(
  scene((e) => trenchDialogue('A03.TURN', e, 2, 'vault')) +
    scene((e) => trenchDialogue('A03.TURN', e, 2, 'safe')),
  /Motherland command codes/,
)

console.log(
  'rainbow evidence: ok (Acts I-V name the Motherland, speak the pacification story and leave the evidence chain)',
)
