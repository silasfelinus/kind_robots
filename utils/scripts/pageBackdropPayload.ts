// /utils/scripts/pageBackdropPayload.ts
//
// The one ArtJob payload both backdrop enqueue scripts send: the direct-Prisma
// enqueuePageBackdropArt.ts and the HTTP enqueuePageBackdropArtViaApi.ts. They
// each carried their own copy of the Krea2 builder, so switching the lane
// meant changing it twice and hoping both agreed.
import {
  BACKDROP_LANE,
  type PageBackdropArtPrompt,
} from './../../stores/seeds/pageBackdropArtPrompts'
import { buildDefaultComfyWorkflow } from './../../server/api/comfy/sdxl/utils/workflow'
import { enrichArtJobPayload } from './../../server/utils/artJobProvenance'

/*
 * Seeded explicitly so a render can be reproduced: --candidates renders a few
 * seeds off to the side and --seed re-renders the one picked as the live
 * backdrop. The builder would otherwise draw a seed it never reports.
 */
function randomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647)
}

export function buildPageBackdropPayload(
  entry: PageBackdropArtPrompt,
  seed: number = randomSeed(),
) {
  const workflow = buildDefaultComfyWorkflow({
    prompt: entry.promptString,
    negativePrompt: entry.negativePrompt,
    checkpoint: BACKDROP_LANE.checkpoint,
    steps: BACKDROP_LANE.steps,
    cfgValue: BACKDROP_LANE.cfg,
    seed,
    sampler: BACKDROP_LANE.sampler,
    scheduler: BACKDROP_LANE.scheduler,
    width: entry.width,
    height: entry.height,
  })

  const { payload } = enrichArtJobPayload('COMFY', {
    requestId: entry.requestId,
    title: entry.title,
    page: entry.page,
    variant: entry.variant,
    promptString: entry.promptString,
    negativePrompt: entry.negativePrompt,
    width: entry.width,
    height: entry.height,
    checkpoint: BACKDROP_LANE.checkpoint,
    steps: BACKDROP_LANE.steps,
    cfg: BACKDROP_LANE.cfg,
    sampler: BACKDROP_LANE.sampler,
    scheduler: BACKDROP_LANE.scheduler,
    seed,
    workflow,
    /*
     * The destination the relay's media agent reads, and the destination
     * resolveArtImageFilePath honours too, so these file under background/
     * instead of the unsorted landing zone.
     */
    imagePath: entry.imagePath,
    save: {
      isPublic: true,
      isMature: false,
      designer: 'Kind Robots / Page Backdrops',
    },
  })

  return payload
}
