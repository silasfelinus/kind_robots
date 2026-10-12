// zuzu-shifting-lands/t-013: reuse accepted, git-tracked Zuzu art for every
// card face until bespoke encounter illustrations land. Authored packs keep
// `art: null` so the bespoke pass (t-023) can still tell what it owes; this
// map is presentation only and never enters the save ledger or replay.
//
// Paths must stay under public/ directories that ship in the image. Never
// point at /images/...: production mounts the media share over that path.

const SCENE = '/zuzu-gamebook/scenes/'
const SECTION = '/zuzu-gamebook/scenes/sections/'
const STAGE = '/zuzu-showdown-stages/'
const CARD = '/shifting-lands/cards/'

// zuzu-shifting-lands t-023/t-026: cards whose own painting has been picked
// from a conductor art round (projects/zuzu-shifting-lands/art/ROUND-*.yaml)
// and exported to public/shifting-lands/cards/<id>.webp. Encounter ids, plus
// trial-<landId> for a land's major trial. A listed card wins over reuse.
export const BESPOKE_CARDS: readonly string[] = [
  'a-crust-for-the-road',
  'a-cup-offered',
  'a-promise-kept',
  'ashes-at-the-border',
  'family-at-the-fence',
  'feathers-in-the-draft',
  'footprints-in-the-silt',
  'gate-still-open',
  'hammer-under-the-stone',
  'lanterns-on-the-raft',
  'marks-below-water',
  'mirror-in-the-ash',
  'one-place-by-the-fire',
  'rope-at-dawn',
  'salt-on-the-threshold',
  'scarecrows-lantern',
  'shelter-for-the-storm',
  'the-banner-in-the-wind',
  'the-boat-that-waits',
  'the-candle-court',
  'the-closed-infirmary',
  'the-cooling-stones',
  'the-empty-pay-cart',
  'the-forgotten-pledge',
  'the-glass-vein',
  'the-key-with-no-door',
  'the-last-seed',
  'the-last-watchfire',
  'the-locked-dormitory',
  'the-map-in-ashes',
  'the-mended-compass',
  'the-night-watch-debt',
  'the-orchard-debt',
  'the-price-of-silence',
  'the-prisoner-of-dusk',
  'the-red-vial',
  'the-reed-music',
  'the-silent-bell',
  'the-third-shadow',
  'the-toll-without-a-keeper',
  'the-watchful-overhang',
  'three-cups-on-the-table',
  'three-doors-no-hinges',
  'toll-of-two-names',
  'trial-cave',
  'trial-dustwater',
  'trial-tablelands',
  'trial-verge',
  'two-empty-buckets',
  'voices-across-the-rock',
  'weighed-in-salt',
]

const bespoke = new Set(BESPOKE_CARDS)

export function bespokeArt(cardId: string): string | null {
  return bespoke.has(cardId) ? CARD + cardId + '.webp' : null
}

export const LAND_SCENERY: Readonly<Record<string, string>> = {
  homestead: SCENE + 'dust-road.webp',
  dustwater: SCENE + 'waterhole.webp',
  tablelands: SCENE + 'canyon.webp',
  cave: SCENE + 'locked-door.webp',
  verge: SCENE + 'bone-valley.webp',
}

export const LOCATION_ART: Readonly<Record<string, string>> = {
  'border-farm': SCENE + 'apple-tree.webp',
  'old-well': SCENE + 'waterhole.webp',
  'wayside-refuge': SCENE + 'mission.webp',
  'ferry-landing': SECTION + 'the-crossing.webp',
  'trading-post': SECTION + 'hb-store-empty.webp',
  'dry-delta': SECTION + 'bone-river.webp',
  quarry: SECTION + 'canyon-road.webp',
  'canyon-trail': SECTION + 'a4-canyon-floor.webp',
  'canyon-camp': SCENE + 'camp.webp',
  'cave-mouth': SECTION + 'a9-cells.webp',
  'stone-hollow': SECTION + 'crypt-glimpse.webp',
  'underground-crossroads': SECTION + 'a4-shrine.webp',
  'obsidian-road': SECTION + 'a7-raider-road.webp',
  'fortified-camp': SECTION + 'a8-mob-gate.webp',
  'last-threshold': SECTION + 'ending-altar.webp',
}

export const ENCOUNTER_ART: Readonly<Record<string, string>> = {
  'family-at-the-fence': SCENE + 'apples-sister.webp',
  'the-orchard-debt': SCENE + 'wagon.webp',
  'scarecrows-lantern': SECTION + 'a6-badger-iron.webp',
  'the-last-seed': SECTION + 'a4-dry-well.webp',
  'rope-at-dawn': SECTION + 'a5-well.webp',
  'a-cup-offered': SECTION + 'a7-cup-on-post.webp',
  'marks-below-water': SCENE + 'ripples.webp',
  'two-empty-buckets': SECTION + 'a4-well-hostage.webp',
  'gate-still-open': SECTION + 'mission-gate.webp',
  'the-locked-dormitory': SCENE + 'empty-cot.webp',
  'a-crust-for-the-road': SECTION + 'supper.webp',
  'the-silent-bell': SCENE + 'bell-tower.webp',
  'lanterns-on-the-raft': SCENE + 'kasa-on-water.webp',
  'toll-of-two-names': SCENE + 'names-wall.webp',
  'the-boat-that-waits': SECTION + 'a1-gun-drowned.webp',
  'weighed-in-salt': SECTION + 'a3-salt-pan.webp',
  'the-mended-compass': SCENE + 'baron-office.webp',
  'three-cups-on-the-table': SECTION + 'a6-bowl-kept.webp',
  'footprints-in-the-silt': SECTION + 'relic.webp',
  'a-road-of-bones': SCENE + 'bone-valley.webp',
  'the-reed-music': SECTION + 'a1-reeds.webp',
  'hammer-under-the-stone': SECTION + 'a3-cloth-dawn.webp',
  'the-empty-pay-cart': SECTION + 'a5-wagon-look.webp',
  'the-glass-vein': SECTION + 'a9-forge-crack.webp',
  'the-watchful-overhang': SECTION + 'a7-high-ground.webp',
  'the-banner-in-the-wind': SECTION + 'bridge-fall.webp',
  'the-toll-without-a-keeper': SECTION + 'a4-well-toll.webp',
  'one-place-by-the-fire': SECTION + 'a3-one-fire.webp',
  'the-map-in-ashes': SECTION + 'a5-note-burned.webp',
  'the-night-watch-debt': SECTION + 'night-watch.webp',
  'feathers-in-the-draft': SECTION + 'a4-witch-blood.webp',
  'the-third-shadow': SECTION + 'a9-thrown.webp',
  'shelter-for-the-storm': SECTION + 'a4-storm-lost.webp',
  'the-candle-court': SECTION + 'a8-knifepoint.webp',
  'salt-on-the-threshold': SECTION + 'a8-altar-door.webp',
  'the-forgotten-pledge': SECTION + 'a8-crypt.webp',
  'three-doors-no-hinges': SECTION + 'a9-tower.webp',
  'voices-across-the-rock': SECTION + 'a9-flight.webp',
  'the-red-vial': SECTION + 'a5-errand-taken.webp',
  'the-cooling-stones': STAGE + 'bone-yard-backdrop-hd.webp',
  'mirror-in-the-ash': SECTION + 'a7-lost.webp',
  'ashes-at-the-border': SECTION + 'ending-ashes.webp',
  'the-last-watchfire': SECTION + 'a7-torches.webp',
  'the-closed-infirmary': SECTION + 'a3-fever-bandage.webp',
  'the-prisoner-of-dusk': SECTION + 'a6-water-house.webp',
  'the-key-with-no-door': SECTION + 'a5-crypt-key.webp',
  'a-promise-kept': SECTION + 'a6-delivered.webp',
  'the-price-of-silence': SECTION + 'a8-bargain.webp',
}

export const TRIAL_ART: Readonly<Record<string, string>> = {
  homestead: SCENE + 'abbess-welcome.webp',
  dustwater: SECTION + 'tracks.webp',
  tablelands: STAGE + 'storm-canyon-backdrop-hd.webp',
  cave: SCENE + 'crow-witch.webp',
  verge: '/zuzu-showdown-boss/door-hd.webp',
}

export function landScenery(landId: string): string {
  return LAND_SCENERY[landId] ?? LAND_SCENERY.homestead!
}

export function locationArt(
  landId: string,
  location: { id: string; art: string | null },
): string {
  return location.art ?? LOCATION_ART[location.id] ?? landScenery(landId)
}

export function encounterArt(
  landId: string,
  encounter: { id: string; art: string | null } | null,
  location: { id: string; art: string | null } | null,
): string {
  if (encounter?.art) return encounter.art
  const painted = encounter ? bespokeArt(encounter.id) : null
  if (painted) return painted
  if (encounter && ENCOUNTER_ART[encounter.id])
    return ENCOUNTER_ART[encounter.id]!
  return location ? locationArt(landId, location) : landScenery(landId)
}

export function trialArt(landId: string, bossArt: string | null): string {
  return (
    bespokeArt('trial-' + landId) ??
    bossArt ??
    TRIAL_ART[landId] ??
    landScenery(landId)
  )
}
