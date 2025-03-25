// stores/utils/randomFunLine.ts

const lines = [
  '🛠️ Debugger gnomes deployed!',
  '🐛 A bug got squashed. RIP.',
  '🧠 Brain mode activated. You are now thinking in code.',
  '⚡ Lightning struck your console… it got smarter.',
  '🚀 You launched another log! Boom!',
  '🎈 This log brought to you by floating optimism.',
  '🍔 Console snacked on your last request.',
  '💾 Saved… by the byte.',
  '🌀 Infinite loop? More like infinite possibilities.',
  '🦕 Dino mode enabled. Rawr!',
]

export function randomFunLine() {
  return lines[Math.floor(Math.random() * lines.length)]
}
