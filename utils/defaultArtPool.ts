// /utils/defaultArtPool.ts
//
// The house pool of stand-in illustrations, and the one deterministic way to
// pick from it.
//
// WHY THIS EXISTS. Silas, 2026-07-25, on the newsfeed: "a lot of blank images
// and so the feed is a sea of empty boxes." newsfeed/t-022 answered that with
// eight illustrations hashed by item id, hard-coded inside feed-card.vue. Silas,
// 2026-08-28: "I need more default art if we don't have an image to go with the
// article. At least 20-40 more in a variety of krea2 styles ... I just want more
// variety and freshness." Eight repeated across a feed AND eight rails of
// showcase cards is the sea of empty boxes again, wearing a different hat — so
// the pool moved out of feed-card, grew, and is now shared by every surface
// that needs a stand-in.
//
// WHY THE LIST IS CHECKED IN RATHER THAN READ FROM DISK. These files live under
// public/images/, which is gitignored and served from the media share, not from
// the deployed bundle — a server route cannot readdir them from Vercel. So the
// repo carries the manifest and `npm run audit:default-art` reconciles it
// against what is actually being served (utils/scripts/auditDefaultArt.ts).
//
// ADDING ART IS A TWO-STEP, ON PURPOSE:
//   1. queue the renders (conductor projects/art-prompts.yaml, targeting
//      public/images/newsfeed/defaults/default-NN.webp)
//   2. once they land, run `npm run audit:default-art` to promote the ones that
//      answer 200 into READY_DEFAULT_ART below
// Listing a name here before the file exists is the one thing that regresses
// the surface: kr-art-plate degrades a failed fallback to its placeholder icon,
// which is exactly the empty box this pool was created to remove.

/**
 * Stand-ins confirmed live. Keep sorted; the audit script rewrites this array
 * wholesale, so hand-edits between its markers will not survive a run.
 */
/* default-art:ready-start */
export const READY_DEFAULT_ART: readonly string[] = [
  '/images/newsfeed/defaults/default-01.webp',
  '/images/newsfeed/defaults/default-02.webp',
  '/images/newsfeed/defaults/default-03.webp',
  '/images/newsfeed/defaults/default-04.webp',
  '/images/newsfeed/defaults/default-05.webp',
  '/images/newsfeed/defaults/default-06.webp',
  '/images/newsfeed/defaults/default-07.webp',
  '/images/newsfeed/defaults/default-08.webp',
]
/* default-art:ready-end */

/**
 * Queued but not yet confirmed. Never rendered — this list is documentation for
 * the audit script and for anyone wondering why the pool is smaller than the
 * prompts file suggests.
 */
export const DEFAULT_ART_POOL_TARGET = 48

/** The path pattern the pool is numbered on, shared with the audit script. */
export function defaultArtPath(index: number): string {
  return `/images/newsfeed/defaults/default-${String(index).padStart(2, '0')}.webp`
}

/**
 * Deterministic per-seed pick.
 *
 * Deterministic matters more than random: a card that re-rolls its stand-in on
 * every re-render flickers, and two cards for the same object on the same page
 * would disagree. The seed is whatever identifies the thing — a feed item's id,
 * or `${kind}-${id}` for a showcase card — so a given object keeps the same
 * stand-in until it gets art of its own.
 */
export function defaultArtFor(seed: string): string {
  const pool = READY_DEFAULT_ART
  if (!pool.length) return ''

  let hash = 0
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0
  }

  return pool[Math.abs(hash) % pool.length] as string
}
