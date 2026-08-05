// /server/api/art/backdrop/[slug].get.ts
//
// Serve a page backdrop by its stable slug, so generated art appears with no
// second step.
//
// Silas, 2026-08-05, on why an export script existed at all: "Shouldn't that be
// unnecessary with the right initial prompt?"
//
// He was right that it should be unnecessary. The cause was not the prompt — it
// was that the frontmatter pointed at a FILE PATH on the Unraid share while art
// completes into an ArtImage row in the DATABASE, and Vercel cannot write to
// that share (docs/self-hosted-media.md). Something had to bridge that by hand.
//
// This removes the bridge. The frontmatter is written ONCE, up front, pointing
// here; the art appears the moment its job reaches DONE. No export, no linking,
// no command to remember.
//
// THE SLUG IS THE JOIN KEY, and it already existed. enqueuePageBackdropArt
// derives `requestId: page-backdrop-<page>-<variant>` deterministically from the
// same two values the frontmatter uses to name its file, so
// `/api/art/backdrop/taskmaster-desktop` is resolvable without storing an id
// anywhere. Nothing has to be written back after generation.
//
// THE MEDIA SHARE IS NOW AN OPTIMISATION, NOT A PREREQUISITE. A file served
// straight from nginx is still cheaper than this route — no function, no
// database read — so exporting bytes to the share remains worth doing at
// leisure. The difference is that nothing has to happen for a page to show its
// art: this resolves on the first request after a job completes, and an export
// later just makes it cheaper by repointing that page's frontmatter at
// /images/<path>.
import {
  createError,
  defineEventHandler,
  getRouterParam,
  sendRedirect,
  setHeader,
} from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'

// `<page>-<variant>` where page may itself contain hyphens (model-builder), so
// the variant is anchored at the end rather than split on the first hyphen.
const SLUG_PATTERN = /^([a-z0-9][a-z0-9-]*)-(mobile|tablet|desktop)$/

export default defineEventHandler(async (event) => {
  try {
    const slug = String(getRouterParam(event, 'slug') || '').toLowerCase()
    const match = SLUG_PATTERN.exec(slug)

    if (!match) {
      throw createError({
        statusCode: 400,
        message:
          'Backdrop slug must be "<page>-<mobile|tablet|desktop>", e.g. taskmaster-desktop.',
      })
    }

    const requestId = `page-backdrop-${slug}`

    /*
     * Matched on the requestId inside the payload rather than a column, because
     * that is where enqueuePageBackdropArt puts it and it is the only value
     * guaranteed stable across a --refresh-failed rewrite. The projectSlug
     * narrows the scan first so this is not a full-table LIKE.
     */
    const job = await prisma.artJob.findFirst({
      where: {
        projectSlug: 'page-backdrops',
        status: 'DONE',
        artImageId: { not: null },
        payload: { contains: `"requestId":"${requestId}"` },
      },
      select: { artImageId: true },
      // Newest wins: a regenerated backdrop should replace its predecessor
      // rather than serving whichever completed first.
      orderBy: { id: 'desc' },
    })

    if (!job?.artImageId) {
      /*
       * NOT AN ERROR CONDITION. Most pages will sit here for a while — the art
       * queue is thousands deep — and kr-page-backdrop already renders nothing
       * when its image fails to load. A 404 is the honest answer and the page
       * degrades exactly as it does with no backdrop declared at all.
       */
      throw createError({
        statusCode: 404,
        message: `No completed backdrop art for "${slug}" yet.`,
      })
    }

    /*
     * Redirect rather than proxy the bytes. /api/art/images/[id]/file already
     * owns the hard parts — visibility checks, WebP transcoding, and the
     * immutable Cache-Control that keeps this route off the critical path after
     * first fetch. Duplicating any of that here would mean two places to keep
     * correct.
     *
     * 302, not 301: which ArtImage a slug resolves to changes when art is
     * regenerated, and a permanent redirect would be cached by browsers past
     * that point with no way to correct it.
     */
    /*
     * Cache the REDIRECT too, or this route runs a database lookup for every
     * page view — the same mistake /api/art/images/[id]/file was making until
     * today, on a route that would be hit just as often.
     *
     * Ten minutes, not immutable: the target changes when art is regenerated,
     * so this trades a short staleness window for keeping the lookup off the
     * hot path. The image it points at stays immutable, so a warm cache costs
     * nothing at all.
     */
    setHeader(event, 'Cache-Control', 'public, max-age=600')
    return sendRedirect(event, `/api/art/images/${job.artImageId}/file`, 302)
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to resolve backdrop art.',
    }
  }
})
