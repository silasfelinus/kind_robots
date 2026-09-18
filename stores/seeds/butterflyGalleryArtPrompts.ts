// /stores/seeds/butterflyGalleryArtPrompts.ts
//
// Static art asset set for the /butterfly-gallery stage (conductor
// butterfly-gallery/t-011), matching projects/butterfly-gallery/
// APPROVED-STAGE-SPEC.md exactly.
//
// FIVE SEPARATE ASSETS, not one composed scene — one per CSS-positioned
// region the page already renders with pure gradients/shapes
// (pages/butterfly-gallery.vue): `.warehouse-backdrop` (room),
// `.runway-slot` (window), `.art-display-inner` (frame), `.preset-bin`
// (bins), `.art-pile` (pile). Each region resizes independently with the
// stage, so one big fixed composition would misalign the moment the
// viewport changes aspect ratio; five small assets, each stretched/tiled
// only within its own region, do not have that problem.
//
// The approved spec is explicit that the STATIC layer is architecture and
// mounts only — no butterflies, robots, artwork, or moving conveyor
// content baked in (those are separate animation/DOM layers). Every prompt
// below keeps to that: structure, material, and light, nothing that acts
// or moves.
export type ButterflyGalleryAssetKey =
  | 'room'
  | 'window'
  | 'frame'
  | 'bins'
  | 'pile'

export type ButterflyGalleryArtPrompt = {
  requestId: string
  asset: ButterflyGalleryAssetKey
  title: string
  width: number
  height: number
  imagePath: string
  promptString: string
  negativePrompt: string
}

const HOUSE_AESTHETIC = `Bright, friendly, minimalist industrial sorting room rendered with crisp Saturday-morning-cartoon cel-shaded energy: clean confident linework, flat controlled color, warm inviting light.`

const NEGATIVE_PROMPT = `caption, lettering, signage, logo, watermark, signature, border, panel, collage, grid, contact sheet, ui mockup, interface elements, buttons, busy cluttered centre, high-contrast centre, harsh clutter, photorealism, low detail, blurry, jpeg artifacts, people, robots, butterflies, framed pictures`

type AssetSeed = {
  asset: ButterflyGalleryAssetKey
  title: string
  width: number
  height: number
  scene: string
}

const ASSETS: AssetSeed[] = [
  {
    asset: 'room',
    title: 'Butterfly Gallery — Warehouse Room',
    width: 1536,
    height: 864,
    scene:
      'An empty industrial warehouse sorting room, seen straight-on and wide. Painted metal walls, exposed roof beams, two elevated catwalks with railings running along the upper left and right, wall-mounted shelving, and rows of hanging pendant lamps. Warm daylight pours through high clerestory windows, spreading soft even light across a plain painted concrete floor. The room stands completely open and empty at floor level: no furniture, no machinery, no funnels, no display stands, no bins, no artwork, and nothing living or moving anywhere in frame. Keep the lower-right corner especially open and uncluttered, and keep the whole middle of the frame calm and airy rather than filled with detail, since a working interface will sit over this image.',
  },
  {
    asset: 'window',
    title: 'Butterfly Gallery — Runway Window Casing',
    width: 1536,
    height: 320,
    scene:
      'One long horizontal industrial window casing, viewed dead-on, spanning the full width of the frame. A riveted steel frame with rounded corners holds a single continuous pane of pale frosted glass lit softly from behind, the metal trim picked out in warm brass fittings. The glass itself stays even and glowing, with nothing crossing or resting in front of it — no birds, no shapes, no shadows of anything moving.',
  },
  {
    asset: 'frame',
    title: 'Butterfly Gallery — Central Display Mount',
    width: 1024,
    height: 1024,
    scene:
      'A single thick industrial display frame or picture mount, viewed straight-on and centered, with its inner opening left as plain flat mid-grey so a picture can be placed inside it later. The frame itself is riveted brushed steel with rounded corners, a recessed inner lip, and a soft warm rim light along one edge. Nothing sits inside the opening and nothing hangs from the frame.',
  },
  {
    asset: 'bins',
    title: 'Butterfly Gallery — Preset Bin Face',
    width: 1024,
    height: 768,
    scene:
      'One industrial collection bin or chute mouth, viewed at a slight three-quarter angle, built from painted sheet metal with a wide scooped opening, a riveted rim, and a small recessed nameplate left blank on its face. The metal is a neutral mid-tone so it can be tinted afterward. The bin sits empty, with nothing inside its opening and nothing beside it.',
  },
  {
    asset: 'pile',
    title: 'Butterfly Gallery — Pile Loading Dock',
    width: 1536,
    height: 512,
    scene:
      'A low raised loading-dock platform set into an industrial floor, viewed straight-on and wide, with a shallow recessed well at its centre bordered by worn yellow-and-black hazard edging. The platform and floor around it are bare painted concrete under warm even light. The recessed well sits completely empty, ready to hold something that is not part of this image.',
  },
]

function buildPrompt(seed: AssetSeed): string {
  return [HOUSE_AESTHETIC, `Scene: ${seed.scene}`].join('\n\n')
}

export const butterflyGalleryArtPrompts: ButterflyGalleryArtPrompt[] =
  ASSETS.map((seed) => ({
    requestId: `butterfly-gallery-art-${seed.asset}`,
    asset: seed.asset,
    title: seed.title,
    width: seed.width,
    height: seed.height,
    imagePath: `public/images/butterfly-gallery/${seed.asset}.webp`,
    promptString: buildPrompt(seed),
    negativePrompt: NEGATIVE_PROMPT,
  }))
