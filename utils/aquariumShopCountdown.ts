// @/utils/aquariumShopCountdown.ts
//
// cthulhuquarium/t-057: formats the rotating shop's next-refresh countdown
// for the unlock panel. GET /api/aquarium/catalog's meta.dateKey (server/
// utils/aquariumEconomy.ts's todaysShopDateKey -- today's UTC calendar day,
// "YYYY-MM-DD") is the only server-side signal this needs; the rotation
// always flips at the next UTC midnight after that date, so there's nothing
// else to derive it from and no new endpoint required.
//
// Deliberately framework-free (no Vue) so both
// stores/cthulhuquariumTankStore.ts and a plain script can use it, same
// discipline as utils/aquariumMilestoneToast.ts.

const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_MINUTE = 60 * 1000

// Midnight UTC of the day AFTER `dateKey` -- the moment the rotation flips.
// `dateKey` is always "YYYY-MM-DD" (todaysShopDateKey's own format); that
// form is specified to parse as UTC midnight of that date, so adding one day
// lands exactly on the next rotation.
export function nextShopRotationAt(dateKey: string): number {
  return Date.parse(`${dateKey}T00:00:00.000Z`) + 24 * MS_PER_HOUR
}

// "Refreshes in Xh Ym" -- null once `now` has reached/passed the rotation
// (the next loadCatalog() call picks up the new dateKey; this never counts
// negative or claims a refresh that hasn't landed client-side yet).
export function formatShopRefreshCountdown(
  dateKey: string,
  now: number = Date.now(),
): string | null {
  const remainingMs = nextShopRotationAt(dateKey) - now
  if (remainingMs <= 0) return null
  const hours = Math.floor(remainingMs / MS_PER_HOUR)
  const minutes = Math.floor((remainingMs % MS_PER_HOUR) / MS_PER_MINUTE)
  return `Refreshes in ${hours}h ${minutes}m`
}
