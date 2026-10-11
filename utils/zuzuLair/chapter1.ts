// /utils/zuzuLair/chapter1.ts
//
// Zuzu's Lair chapter 1 scene graph (timing and branching only). Ported from conductor
// projects/zuzu-lair/chapters/01-dry-gulch/SCENES.yaml; prompts stay in the YAML, the engine
// needs only ids, clip lengths, windows and edges.

import type { LairChapter } from './types'

export const CHAPTER_1: LairChapter = {
  id: '01-dry-gulch',
  title: 'The Dry Gulch',
  assistExtra: 0.8,
  lives: 3,
  nodes: [
    { id: 'opening', kind: 'opening', seconds: 5, next: 'm1-bridge' },
    {
      id: 'm1-bridge',
      kind: 'moment',
      seconds: 4,
      window: [2.2, 3.0],
      expect: 'up',
      success: 'm1-bridge-ok',
      death: 'm1-bridge-death',
    },
    { id: 'm1-bridge-ok', kind: 'success', seconds: 3, next: 'm2-scorpion' },
    { id: 'm1-bridge-death', kind: 'death', seconds: 4, retry: 'm1-bridge' },
    {
      id: 'm2-scorpion',
      kind: 'moment',
      seconds: 4,
      window: [1.8, 2.5],
      expect: 'right',
      success: 'm2-scorpion-ok',
      death: 'm2-scorpion-death',
    },
    { id: 'm2-scorpion-ok', kind: 'success', seconds: 3, next: 'm3-rockslide' },
    {
      id: 'm2-scorpion-death',
      kind: 'death',
      seconds: 3,
      retry: 'm2-scorpion',
    },
    {
      id: 'm3-rockslide',
      kind: 'moment',
      seconds: 4,
      window: [2.0, 2.7],
      expect: 'left',
      success: 'm3-rockslide-ok',
      death: 'm3-rockslide-death',
    },
    { id: 'm3-rockslide-ok', kind: 'success', seconds: 3, next: 'm4-bandit' },
    {
      id: 'm3-rockslide-death',
      kind: 'death',
      seconds: 3,
      retry: 'm3-rockslide',
    },
    {
      id: 'm4-bandit',
      kind: 'moment',
      seconds: 4,
      window: [2.4, 2.9],
      expect: 'sword',
      success: 'm4-bandit-ok',
      death: 'm4-bandit-death',
    },
    { id: 'm4-bandit-ok', kind: 'success', seconds: 3, next: 'closing' },
    { id: 'm4-bandit-death', kind: 'death', seconds: 3, retry: 'm4-bandit' },
    { id: 'closing', kind: 'closing', seconds: 5 },
  ],
}
