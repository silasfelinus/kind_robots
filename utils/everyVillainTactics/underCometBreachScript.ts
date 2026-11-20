import type { SceneScript } from './sceneGraph'

/**
 * Crossfire chapter five. Two approaches enter the same containment site,
 * while the inner coolant channel fires every other round and reinforcements
 * enter from both ends. Taking down the rival seal-keeper is the only victory.
 */
export const UNDER_COMET_BREACH_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'breach-opening',
      title: 'The Earth Beneath the School',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The city is hollow beneath Comet Academy. On the lower containment deck, a cracked coolant line sparks beside the sealed reactor while rival squads hold both tunnel exits.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'wide',
          text: 'We have seven rounds until the containment seal closes forever. Backdraft takes the north entry; Priya and Hattie take the service route below. Both lanes lead to the seal-keeper.',
          next: null,
          branch: {
            when: { kind: 'perspective', perspective: 'villain' },
            then: 'ov',
            else: 'oh',
          },
        },
        {
          id: 'oh',
          speaker: 'hattie',
          role: 'sidekick',
          emotion: 'afraid',
          camera: 'close',
          text: 'The people hiding down here were promised shelter. Their seal-keeper thinks the surface wants them buried. We have to stop the lock without proving him right.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'vee',
          role: 'henchman',
          emotion: 'sly',
          camera: 'close',
          text: 'There is a vault full of names under the reactor. The seal-keeper is protecting them. Anyone who owns that list owns the next story this city tells.',
          next: null,
        },
      ],
    },
    {
      id: 'breach-fork',
      title: 'The Last Relief Valve',
      trigger: { kind: 'turn', round: 2 },
      start: 'c1',
      nodes: [
        {
          id: 'c1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: 'A damaged valve is flooding the lower passage. I can vent the pressure to clear our injured team, or shut down the rival radios and protect the evidence in the vault.',
          next: 'c2',
        },
        {
          id: 'c2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Pick one. We cannot hold the valve open and jam their channel at the same time.',
          next: null,
          choices: [
            {
              label: 'Vent the valve and protect the crew',
              next: 'cv',
              effects: [
                { kind: 'flag', flag: 'breach-vented' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Black out their comms and seize the evidence',
              next: 'ce',
              effects: [
                { kind: 'flag', flag: 'breach-evidence' },
                { kind: 'suppress' },
              ],
            },
          ],
        },
        {
          id: 'cv',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'The pressure has dropped enough for the injured to breathe. The lock is still counting down, and the rivals are still in our way.',
          next: null,
        },
        {
          id: 'ce',
          speaker: 'vee',
          emotion: 'sly',
          camera: 'over-shoulder',
          text: 'Their command channel is dark, and the vault keys are ours. We have made enemies of whoever paid to keep those names hidden.',
          next: null,
        },
      ],
    },
    {
      id: 'breach-vent-result',
      title: 'A Little Room to Breathe',
      trigger: { kind: 'flag', flag: 'breach-vented' },
      start: 'v1',
      nodes: [
        {
          id: 'v1',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'wide',
          text: 'The crew can regroup. Keep the north and south approaches alive; nobody needs to die for an old reactor.',
          next: null,
        },
      ],
    },
    {
      id: 'breach-evidence-result',
      title: 'Names on the Ledger',
      trigger: { kind: 'flag', flag: 'breach-evidence' },
      start: 'e1',
      nodes: [
        {
          id: 'e1',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'The files name every sponsor who paid to hide the tunnels. The squad will remember this even if we do not escape with the reactor intact.',
          next: null,
        },
      ],
    },
    {
      id: 'breach-pursuit',
      title: 'Tunnel Shadows',
      trigger: { kind: 'turn', round: 3 },
      start: 't1',
      nodes: [
        {
          id: 't1',
          speaker: 'vee',
          emotion: 'afraid',
          camera: 'wide',
          text: 'Watch the two outer gates. Clockwork Wombat Ronin are arriving, and the blue coolant circuit goes live on alternating rounds. The central bridge will buckle next.',
          next: null,
        },
      ],
    },
    {
      id: 'breach-collapse',
      title: 'A Floor Without a Promise',
      trigger: { kind: 'turn', round: 4 },
      start: 'f1',
      nodes: [
        {
          id: 'f1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'over-shoulder',
          text: 'That floor panel has fallen through. Do not chase the seal-keeper across the cracked tile. The lower path is still open if we keep moving.',
          next: null,
        },
      ],
    },
    {
      id: 'breach-secret',
      title: 'The Disappeared Register',
      trigger: { kind: 'secret' },
      start: 's1',
      nodes: [
        {
          id: 's1',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'These names are the people the surface declared missing. Somebody has been sending food down here for years. This changes who was really trapped.',
          next: null,
        },
      ],
    },
    {
      id: 'breach-victory',
      title: 'The Seal Breaks',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'w1',
      nodes: [
        {
          id: 'w1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The seal-keeper falls and the containment doors unlock. The people beneath Comet City have one more night to decide what comes next.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'breach-vented' },
            then: 'wv',
            else: 'we',
          },
        },
        {
          id: 'wv',
          speaker: 'hattie',
          role: 'sidekick',
          emotion: 'joyful',
          camera: 'close',
          text: 'Our crew got home. The people below will choose their own future. We can ask questions tomorrow without anyone choking on coolant.',
          next: null,
        },
        {
          id: 'we',
          speaker: 'vee',
          role: 'henchman',
          emotion: 'determined',
          camera: 'close',
          text: 'The evidence survived. Their sponsors will not sleep tonight, but our own people will remember that we chose the files first.',
          next: null,
        },
      ],
    },
    {
      id: 'breach-defeat',
      title: 'Beneath the Lock',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd1',
      nodes: [
        {
          id: 'd1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The lock closes with the seal-keeper still standing. Your team retreats through the service ladder as the tunnel lights go out behind them.',
          next: null,
        },
      ],
    },
  ],
}
