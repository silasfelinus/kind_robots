import type { CastId } from './characters'

// zuzu-shifting-lands/t-052: which Book One cast members appear in the
// existing V2-V6 encounter cards. A sidecar, like t-049's spent deeds, so the
// deck files and their fingerprints stay untouched. Species alone never tags a
// card: the tithe basket's raccoon children are not Jeffery Mittens, and the
// coyote raider under the arch is not the vagrant. The V10 draw never deals a
// card whose cast includes the player's own identity.
export const BASE_CARD_CAST: Readonly<Record<string, readonly CastId[]>> = {
  'a-crust-for-the-road': ['the-abbess'],
  'the-silent-bell': ['the-abbess'],
  'bread-under-the-long-table': ['the-abbess'],
  'the-guest-book-on-the-lectern': ['the-abbess'],
  'the-infirmarys-last-cot': ['the-abbess'],
  // t-053 expansion: Tamsin is the guide on this card, so she is never dealt it.
  'five-fallen-cairns': ['tamsin'],
}
