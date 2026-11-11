/**
 * The mature-edition Monstrique title splash, as ArtImage ids. Server-only:
 * the ids and their paths never ship in the client bundle, and
 * GET /api/monstrique/splash returns them only to a verified adult opt-in
 * session. The general edition's splash is a static file under
 * public/monstrique/front/. Approved by Silas 2026-11-11 PT ("Approve the
 * mature splash"): ArtImages 268798 (landscape) and 268801 (portrait).
 */
export const MONSTRIQUE_MATURE_SPLASH: {
  wide: number | null
  tall: number | null
} = {
  wide: 268798,
  tall: 268801,
}
