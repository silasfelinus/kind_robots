// Slime City account progression and story sync are admin-preview only
// (server/utils/slimeCityProgress.ts requireSlimeCityPreviewUser). A signed-in
// visitor who is not in the preview gets HTTP 403 from those routes. That is
// an intentional gate, not a sync failure, so the lab plays locally on this
// device instead of showing STORY SYNC ERROR (conductor slime-city/t-067).

export const SLIME_CITY_LOCAL_PLAY_NOTICE =
  'Account rewards are still in preview. Your journey saves on this device.'

export function isSlimeCityPreviewGate(
  result: { status?: number } | null | undefined,
): boolean {
  return result?.status === 403
}
