// /utils/sceneAnimatorPrompt.ts
//
// The motion direction every Scene Animator clip is rendered with.
//
// Lives in utils/ rather than server/utils/ so the admin surface can render the
// exact string that will be sent. It previously lived server-side only, and
// pages/admin/scene-animator.vue reproduced it as literal HTML in its
// "Automatic motion direction" panel -- two copies, no link between them, so
// editing the prompt would have left the operator reading the old one with no
// indication anything had changed.
//
// TUNING HISTORY. The first version asked for "subtle coherent motion ...
// only plausible ambient movement, gentle secondary motion, and stable
// cinematic camera behavior", and got exactly what it asked for: Silas,
// 2026-09-11, on the first real batch -- "the animations are pretty lackluster
// ... the others have minimal movement". Every hedge in that sentence (subtle,
// only, gentle, stable) was a vote against motion, and WAN obliged.
//
// The one clip he rated highly moved a robot deliberately and gave it an
// interaction, which is the bar. So the direction now asks for motion plainly
// and, where there is a figure, names the performance wanted: "if there is a
// figure, they should be animated, wink, smile, laugh".
//
// What must NOT loosen is subject integrity. The same batch produced a
// miniature figure riding a Segway across the Humboldt Scoop Solutions dog
// logo -- invented from nothing. The final clause is the guard against that,
// and the negative prompt below reinforces it; keep both when retuning.
export const SCENE_ANIMATOR_PROMPT =
  'Animate this scene with clear, deliberate motion. Any person, animal, ' +
  'robot, or character in the frame must visibly perform: blink, shift ' +
  'expression with a smile, a wink or a laugh, turn or tilt the head, and ' +
  'move hands, arms or body with intent. Give the rest of the scene life as ' +
  'well -- hair and cloth sway, foliage and water move, light and shadow ' +
  'shift, background elements drift. Camera movement stays slow and ' +
  'purposeful. Preserve every subject exactly as drawn: identity, faces, ' +
  'design, colors, composition, and art style are unchanged, and no ' +
  'character, creature, vehicle, object, logo, or text is added, removed, or ' +
  'replaced.'

// Sent as the negative prompt on every Scene Animator job.
//
// Two jobs, matching the two ways the first batch went wrong. The stillness
// terms push against the near-frozen results; the addition terms push against
// inventions like the Segway rider. A negative prompt is the right lever for
// both -- it constrains without spending positive-prompt attention, which is
// where the performance direction above needs to land.
export const SCENE_ANIMATOR_NEGATIVE_PROMPT =
  'static image, still frame, frozen, motionless, no movement, slideshow, ' +
  'duplicate frames, additional characters, extra people, extra limbs, new ' +
  'objects appearing, vehicles, added text, watermark, signature, logo ' +
  'changes, identity change, face morphing, distortion, warping, flicker'
