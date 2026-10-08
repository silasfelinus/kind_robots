// /utils/arcade/pinball/clock.ts
//
// The physics clock, shared by physics, rules timers and tests. The Arcade
// loop ticks at 60 Hz; each tick runs PHYSICS_HZ / 60 fixed physics steps.
// 240 Hz keeps an 18 ms flipper stroke four steps long, so a fast bat meets
// the ball with contact detail instead of jumping past it
// (conductor kind-pinball/t-005).

export const PHYSICS_HZ = 240
