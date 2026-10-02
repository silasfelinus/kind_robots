// /stores/seeds/butterflyGalleryMotionPrompts.ts
//
// Motion assets for the /butterfly-gallery stage, regenerated so they sit in
// the scene instead of floating over it as boxed-in rectangles:
//
//   - runway: the window strip shows the room's own runway-background.png as
//     the FIRST FRAME of every clip, with a locked camera, so the animation is
//     only tiny, distant butterflies drifting through the existing view.
//   - butterfly / robot: video models cannot emit alpha, so each character is
//     first re-staged by Kontext onto a flat key colour (black for the glowing
//     butterfly, green for the robot) and that still becomes the video's first
//     frame. The page removes the key colour at display time.

export type ButterflyGalleryMotionKey =
  | 'runway-flock-right'
  | 'runway-flock-left'
  | 'runway-drift'
  | 'butterfly-loop'
  | 'robot-loop'

export type ButterflyGalleryStillKey = 'butterfly-keyed' | 'robot-keyed'

export type ButterflyGalleryStillPrompt = {
  requestId: string
  key: ButterflyGalleryStillKey
  sourceFile: string
  width: number
  height: number
  promptString: string
}

export type ButterflyGalleryMotionPrompt = {
  requestId: string
  key: ButterflyGalleryMotionKey
  firstFrame: string
  width: number
  height: number
  durationSeconds: number
  loop: boolean
  promptString: string
  negativePrompt: string
}

const LOCKED_CAMERA = `Static locked-off shot, fixed framing, completely still camera, like a photograph with only the tiny butterflies animated. The picture never zooms, pushes in, pulls out, pans, tilts, or shifts perspective, and the window, pillars, catwalk, lamps, trees, skyline and sunset stay exactly where they are in every frame.`

const MOTION_NEGATIVE = `zoom in, push in, dolly in, camera moves forward, camera moves closer, parallax, camera movement, zoom, dolly, pan, tilt, reframing, scene change, cut, morphing background, warped architecture, large foreground butterfly, close-up butterfly, giant butterfly, butterfly covering the view, text, watermark, logo, blurry, jpeg artifacts, extra characters, robots, people, flicker, strobing`

export const butterflyGalleryStillPrompts: ButterflyGalleryStillPrompt[] = [
  {
    requestId: 'butterfly-gallery-motion-v2-butterfly-keyed',
    key: 'butterfly-keyed',
    sourceFile: 'gallery-butterfly-start.png',
    width: 1024,
    height: 1024,
    promptString: `Keep the rainbow-winged butterfly exactly as it is: same face, eyes, antennae, wing shapes, colours, and pose, centred at the same size. Replace the entire background with a perfectly flat, solid pure black (#000000) with no gradient, no vignette, no glow spilling onto the background, no shadow, and no floor.`,
  },
  {
    requestId: 'butterfly-gallery-motion-v2-robot-keyed',
    key: 'robot-keyed',
    sourceFile: 'robot-sift-start.png',
    width: 1024,
    height: 1024,
    promptString: `Keep the robot and the cards it is holding exactly as they are: same design, colours, pose, and size, centred. Replace the entire background with a perfectly flat, solid pure chroma-key green (#00FF00) with no gradient, no vignette, no shadow, no floor, and no green light reflected onto the robot.`,
  },
]

export const butterflyGalleryMotionPrompts: ButterflyGalleryMotionPrompt[] = [
  {
    requestId: 'butterfly-gallery-motion-v2-runway-flock-right',
    key: 'runway-flock-right',
    firstFrame: 'runway-background.png',
    width: 1152,
    height: 384,
    durationSeconds: 5,
    loop: true,
    promptString: `${LOCKED_CAMERA} A small flock of five tiny, distant rainbow-winged butterflies, each only a few pixels across, flutters through the hazy far distance above the treeline, drifting slowly from the left side of the view toward the right and then looping back, keeping well away from the camera. They are far in the background, soft and slightly hazy with distance, with gentle wingbeats and lazy curving flight paths. Only the butterflies move; the sunset sky, hills, city, bridge, and trees stay still apart from a very faint natural sway.`,
    negativePrompt: MOTION_NEGATIVE,
  },
  {
    requestId: 'butterfly-gallery-motion-v2-runway-flock-left',
    key: 'runway-flock-left',
    firstFrame: 'runway-background.png',
    width: 1152,
    height: 384,
    durationSeconds: 5,
    loop: true,
    promptString: `${LOCKED_CAMERA} Four tiny, distant rainbow-winged butterflies, each only a few pixels across, drift slowly from the right side of the view toward the left across the far distance, rising and dipping lazily, then looping back. They stay very small and far away in the background, softened by atmospheric haze. Only the butterflies move; everything else stays still apart from a very faint natural sway.`,
    negativePrompt: MOTION_NEGATIVE,
  },
  {
    requestId: 'butterfly-gallery-motion-v2-runway-drift',
    key: 'runway-drift',
    firstFrame: 'runway-background.png',
    width: 1152,
    height: 384,
    durationSeconds: 5,
    loop: true,
    promptString: `${LOCKED_CAMERA} Seven tiny, distant butterflies with rainbow wings flutter back and forth in small lazy loops at different distances in the far background, some crossing left to right, others right to left, a couple circling near the treetops. All are very small, pixel-sized specks of colour with soft haze. Only the butterflies move; the rest of the picture holds still.`,
    negativePrompt: MOTION_NEGATIVE,
  },
  {
    requestId: 'butterfly-gallery-motion-v2-butterfly-loop',
    key: 'butterfly-loop',
    firstFrame: 'butterfly-keyed',
    width: 768,
    height: 768,
    durationSeconds: 4,
    loop: true,
    promptString: `The rainbow-winged Gallery butterfly from the first frame hovers in place against the flat solid black background, beating its wings in a gentle, steady flutter with a slight bob up and down, then settles back to its starting pose so the loop repeats seamlessly. The background stays perfectly flat pure black the whole time. The camera is locked off with no zoom or movement, and the butterfly stays the same size and fully inside the frame with a margin on every side.`,
    negativePrompt: `${MOTION_NEGATIVE}, background gradient, glow on background, floor, shadow, scenery`,
  },
  {
    requestId: 'butterfly-gallery-motion-v2-robot-loop',
    key: 'robot-loop',
    firstFrame: 'robot-keyed',
    width: 768,
    height: 768,
    durationSeconds: 4,
    loop: true,
    promptString: `The small Kind Robots robot from the first frame sifts through the pictures in its hands: it lifts one up, tilts its head curiously from side to side, sets it down, and picks up another, then returns to its starting pose so the loop repeats seamlessly. The background stays perfectly flat solid chroma-key green the whole time. The camera is locked off with no zoom or movement, and the robot stays the same size and fully inside the frame with a margin on every side.`,
    negativePrompt: `${MOTION_NEGATIVE}, background gradient, floor, shadow, scenery, green reflections on the robot`,
  },
]
