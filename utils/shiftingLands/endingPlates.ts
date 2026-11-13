// zuzu-shifting-lands ENDINGS-STANDARD-ROUND-1 (main-game standard item 6):
// every shared ending has its own painted plate, and none of them shows a
// protagonist, so the same picture fits whichever traveler walked the road.
// The displayed title decides the plate: a moral constellation's title first,
// then a V7 retitle, then the mark ending (endingsV6.ts, endingsV7.ts,
// endingsConstellationsV7.ts). Files ship under public/shifting-lands/endings/.
export const SHARED_ENDING_PLATES: Readonly<Record<string, string>> = {
  'A Well With No Lock': 'shared-well',
  'The Door Held Open': 'open-door',
  'The Toll Nobody Sees': 'masked-rule',
  'The Truth With Teeth': 'scarred-witness',
  'The Last Loaf': 'last-loaf',
  'The Book Left Open': 'unsealed-book',
  'The Bell That Answers': 'bell-again',
  'The Ford Without a Name': 'unmarked-ford',
  'The Crown Made of Salt': 'salt-crown',
  'The Road No One Names': 'unnamed-road',
  'The Debt Carried Open': 'debt-carried-open',
  'A Road Wide Enough for Everyone': 'road-wide-enough',
  'The Lantern Commons': 'commons',
  'The Book Nobody Owns': 'public-record',
  'A Ford With No Toll': 'wayfinders',
  'The Franchise of Hunger': 'tribute',
  'The Province of Empty Hands': 'coercion',
  'The Market of Silence': 'mixed-dominion',
  'A Bridge Without Forgiveness': 'restitution',
}

export const sharedEndingPlate = (
  title: string | null | undefined,
): string | null =>
  title && Object.hasOwn(SHARED_ENDING_PLATES, title)
    ? `/shifting-lands/endings/${SHARED_ENDING_PLATES[title]}.webp`
    : null
