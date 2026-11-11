/**
 * The mature-edition Monstrique title splash, as ArtImage ids. Server-only:
 * the ids and their paths never ship in the client bundle, and
 * GET /api/monstrique/splash returns them only to a verified adult opt-in
 * session. The general edition's splash is a static file under
 * public/monstrique/front/. Null until Silas approves a rendered image.
 */
export const MONSTRIQUE_MATURE_SPLASH: {
  wide: number | null
  tall: number | null
} = {
  wide: null,
  tall: null,
}
