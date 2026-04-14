// stores/utils/randomFunLine.ts

export const funList = [
  // Classic console silliness
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

  // Code chaos
  '🔄 Your recursive function just proposed to itself.',
  '🧃 Memory leak detected — please hydrate your RAM.',
  '🧹 Garbage collector sweeping... please tip.',
  '⛏️ You mined some legacy code. It bit back.',
  '🧩 Stack overflow? Try turning it into a stack pancake.',
  '📉 Confidence in your logic dropped 12%. Market panic ensues.',
  '☕ Java is brewing… still… any second now...',
  '🦥 Slow query detected. Console fell asleep waiting.',
  '📦 You opened a mystery package. It installed itself.',
  '📐 Code aligned. Or at least... it *thinks* so.',

  // Meta-humor
  '🧍 This log has no idea what it’s doing, but it’s doing it enthusiastically.',
  '🎭 Now interpreting logs interpretively.',
  '📚 Console just wrote a haiku about you. It’s private.',
  '🦝 Raccoon found in console. May have chewed on logs.',
  '🧃 Refreshing cache... with orange juice?',
  '🐸 Console compiled your emotions. Several warnings.',
  '📡 Console is broadcasting on frequencies unknown to science.',
  '🧙‍♂️ You cast “fix it” — console casts “nah”.',
  '📸 Snapshot taken. Console looks fabulous.',
  '🎁 You’ve unlocked: Log of Mystery. Don’t open it after midnight.',
]

export function randomFunLine(): string {
  return funList[Math.floor(Math.random() * funList.length)]!
}
