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
const OUTCOME = '/shifting-lands/outcomes/'

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

// zuzu-shifting-lands t-028: consequence paintings from art round 2
// (projects/zuzu-shifting-lands/art/ROUND-2.yaml), one per authored choice
// and result, exported to public/shifting-lands/outcomes/<key>.webp. Keys are
// <cardId>--<choiceId>--success|failure, with trial-<landId> as the card id
// for major trials. An outcome without a painting falls back to its card.
export const BESPOKE_OUTCOMES: readonly string[] = [
  'a-crust-for-the-road--offer-help--success',
  'a-crust-for-the-road--thank-with-bow--failure',
  'a-crust-for-the-road--thank-with-bow--success',
  'a-cup-offered--ask-ingredients--failure',
  'a-cup-offered--ask-ingredients--success',
  'a-cup-offered--drink-first--failure',
  'a-cup-offered--drink-first--success',
  'a-promise-kept--carry-the-sealed-letter--failure',
  'a-promise-kept--carry-the-sealed-letter--success',
  'a-promise-kept--help-search-for-its-owner--failure',
  'a-promise-kept--help-search-for-its-owner--success',
  'a-road-of-bones--ask-the-guide-to-lead--failure',
  'a-road-of-bones--ask-the-guide-to-lead--success',
  'a-road-of-bones--cross-on-the-old-timbers--failure',
  'a-road-of-bones--cross-on-the-old-timbers--success',
  'ashes-at-the-border--offer-to-scout-the-tower--success',
  'ashes-at-the-border--repair-the-signal-horn--failure',
  'ashes-at-the-border--repair-the-signal-horn--success',
  'family-at-the-fence--guard-the-gate--failure',
  'family-at-the-fence--guard-the-gate--success',
  'family-at-the-fence--honor-guest--failure',
  'family-at-the-fence--honor-guest--success',
  'feathers-in-the-draft--answer-her-question-plainly--failure',
  'feathers-in-the-draft--answer-her-question-plainly--success',
  'feathers-in-the-draft--study-the-returning-draft--failure',
  'feathers-in-the-draft--study-the-returning-draft--success',
  'footprints-in-the-silt--follow-the-wet-prints--success',
  'footprints-in-the-silt--help-set-new-markers--failure',
  'footprints-in-the-silt--help-set-new-markers--success',
  'gate-still-open--accept-stew--failure',
  'gate-still-open--accept-stew--success',
  'gate-still-open--inspect-arch--failure',
  'gate-still-open--inspect-arch--success',
  'hammer-under-the-stone--brace-the-loosened-wall--failure',
  'lanterns-on-the-raft--ask-why-the-lantern-burns--failure',
  'lanterns-on-the-raft--ask-why-the-lantern-burns--success',
  'lanterns-on-the-raft--offer-to-steady-the-mooring--failure',
  'lanterns-on-the-raft--offer-to-steady-the-mooring--success',
  'marks-below-water--measure-stone--failure',
  'marks-below-water--measure-stone--success',
  'marks-below-water--sound-depth--failure',
  'marks-below-water--sound-depth--success',
  'mirror-in-the-ash--read-the-discarded-letters--failure',
  'mirror-in-the-ash--read-the-discarded-letters--success',
  'mirror-in-the-ash--trade-a-true-memory--failure',
  'mirror-in-the-ash--trade-a-true-memory--success',
  'one-place-by-the-fire--accept-the-offered-place--failure',
  'one-place-by-the-fire--accept-the-offered-place--success',
  'one-place-by-the-fire--ask-about-the-missing-name--failure',
  'one-place-by-the-fire--ask-about-the-missing-name--success',
  'rope-at-dawn--take-the-rope--failure',
  'rope-at-dawn--take-the-rope--success',
  'rope-at-dawn--tie-new-knot--failure',
  'rope-at-dawn--tie-new-knot--success',
  'salt-on-the-threshold--reinforce-the-vent-above--failure',
  'salt-on-the-threshold--reinforce-the-vent-above--success',
  'salt-on-the-threshold--test-the-air-carefully--failure',
  'salt-on-the-threshold--test-the-air-carefully--success',
  'scarecrows-lantern--cut-the-line--failure',
  'scarecrows-lantern--cut-the-line--success',
  'scarecrows-lantern--follow-footsteps--failure',
  'scarecrows-lantern--follow-footsteps--success',
  'shelter-for-the-storm--carry-the-medicine-chest--failure',
  'shelter-for-the-storm--carry-the-medicine-chest--success',
  'shelter-for-the-storm--guide-the-stranded-travelers--failure',
  'shelter-for-the-storm--guide-the-stranded-travelers--success',
  'the-banner-in-the-wind--decode-the-banner-knots--failure',
  'the-banner-in-the-wind--decode-the-banner-knots--success',
  'the-banner-in-the-wind--search-below-the-bridge--failure',
  'the-banner-in-the-wind--search-below-the-bridge--success',
  'the-boat-that-waits--repair-the-rudder--failure',
  'the-boat-that-waits--repair-the-rudder--success',
  'the-boat-that-waits--wait-for-its-owner--failure',
  'the-boat-that-waits--wait-for-its-owner--success',
  'the-candle-court--hear-both-testimonies--failure',
  'the-candle-court--hear-both-testimonies--success',
  'the-candle-court--offer-a-shared-judgment--failure',
  'the-candle-court--offer-a-shared-judgment--success',
  'the-closed-infirmary--calm-the-waiting-guards--failure',
  'the-closed-infirmary--calm-the-waiting-guards--success',
  'the-closed-infirmary--inspect-the-sealed-room--success',
  'the-cooling-stones--help-lay-a-new-crossing--failure',
  'the-cooling-stones--help-lay-a-new-crossing--success',
  'the-cooling-stones--mark-the-unsafe-seam--failure',
  'the-empty-pay-cart--read-the-pay-sheet-aloud--failure',
  'the-empty-pay-cart--refuse-the-crooked-bargain--failure',
  'the-empty-pay-cart--refuse-the-crooked-bargain--success',
  'the-forgotten-pledge--examine-the-iron-charm--failure',
  'the-forgotten-pledge--examine-the-iron-charm--success',
  'the-forgotten-pledge--speak-the-oath-back-to-him--failure',
  'the-forgotten-pledge--speak-the-oath-back-to-him--success',
  'the-glass-vein--carry-the-collector-s-load--failure',
  'the-glass-vein--carry-the-collector-s-load--success',
  'the-glass-vein--cut-a-safe-sample--success',
  'the-key-with-no-door--ask-who-forged-the-key--failure',
  'the-key-with-no-door--ask-who-forged-the-key--success',
  'the-key-with-no-door--read-the-worn-carving--failure',
  'the-key-with-no-door--read-the-worn-carving--success',
  'the-last-seed--share-water--failure',
  'the-last-seed--share-water--success',
  'the-last-seed--shield-shoot--failure',
  'the-last-seed--shield-shoot--success',
  'the-last-watchfire--organize-the-watch-rota--failure',
  'the-last-watchfire--organize-the-watch-rota--success',
  'the-last-watchfire--volunteer-for-the-search--success',
  'the-locked-dormitory--question-novice--failure',
  'the-locked-dormitory--question-novice--success',
  'the-locked-dormitory--search-lock--success',
  'the-map-in-ashes--persuade-her-to-stop--success',
  'the-map-in-ashes--rescue-the-marked-fragment--failure',
  'the-map-in-ashes--rescue-the-marked-fragment--success',
  'the-mended-compass--compare-the-two-charts--success',
  'the-mended-compass--help-reset-the-compass--failure',
  'the-mended-compass--help-reset-the-compass--success',
  'the-night-watch-debt--follow-the-counted-footsteps--failure',
  'the-night-watch-debt--follow-the-counted-footsteps--success',
  'the-night-watch-debt--take-the-first-watch--failure',
  'the-night-watch-debt--take-the-first-watch--success',
  'the-orchard-debt--brace-axle--failure',
  'the-orchard-debt--brace-axle--success',
  'the-orchard-debt--lift-together--failure',
  'the-orchard-debt--lift-together--success',
  'the-price-of-silence--question-the-cost-openly--failure',
  'the-price-of-silence--question-the-cost-openly--success',
  'the-price-of-silence--refuse-the-secret-bargain--failure',
  'the-prisoner-of-dusk--question-the-scout-quietly--failure',
  'the-prisoner-of-dusk--question-the-scout-quietly--success',
  'the-prisoner-of-dusk--secure-the-copper-restraint--failure',
  'the-prisoner-of-dusk--secure-the-copper-restraint--success',
  'the-red-vial--ask-about-the-binding-spell--failure',
  'the-red-vial--ask-about-the-binding-spell--success',
  'the-red-vial--help-secure-the-vial--failure',
  'the-red-vial--help-secure-the-vial--success',
  'the-reed-music--listen-between-the-notes--failure',
  'the-reed-music--listen-between-the-notes--success',
  'the-reed-music--offer-an-old-traveling-song--failure',
  'the-reed-music--offer-an-old-traveling-song--success',
  'the-silent-bell--ask-about-bell--failure',
  'the-silent-bell--ask-about-bell--success',
  'the-silent-bell--climb-stairs--failure',
  'the-third-shadow--count-the-lantern-positions--failure',
  'the-third-shadow--demand-a-safer-passage--failure',
  'the-third-shadow--demand-a-safer-passage--success',
  'the-toll-without-a-keeper--challenge-the-false-toll--failure',
  'the-toll-without-a-keeper--offer-a-fair-trade--failure',
  'the-toll-without-a-keeper--offer-a-fair-trade--success',
  'the-watchful-overhang--call-the-travelers-back--failure',
  'the-watchful-overhang--call-the-travelers-back--success',
  'the-watchful-overhang--test-the-ledge-alone--failure',
  'three-cups-on-the-table--question-the-armed-patrons--success',
  'three-cups-on-the-table--share-the-untouched-meal--failure',
  'three-cups-on-the-table--share-the-untouched-meal--success',
  'three-doors-no-hinges--ask-for-a-witness-to-the-path--failure',
  'three-doors-no-hinges--ask-for-a-witness-to-the-path--success',
  'three-doors-no-hinges--compare-the-chain-marks--failure',
  'three-doors-no-hinges--compare-the-chain-marks--success',
  'toll-of-two-names--copy-the-ledger-quietly--failure',
  'toll-of-two-names--copy-the-ledger-quietly--success',
  'toll-of-two-names--demand-an-honest-account--failure',
  'toll-of-two-names--demand-an-honest-account--success',
  'trial-cave--confront--failure',
  'trial-cave--confront--success',
  'trial-cave--evidence--failure',
  'trial-cave--evidence--success',
  'trial-cave--parley--failure',
  'trial-cave--parley--success',
  'trial-dustwater--confront--failure',
  'trial-dustwater--confront--success',
  'trial-dustwater--evidence--failure',
  'trial-dustwater--evidence--success',
  'trial-dustwater--parley--failure',
  'trial-dustwater--parley--success',
  'trial-homestead--confront--failure',
  'trial-homestead--confront--success',
  'trial-homestead--evidence--failure',
  'trial-homestead--evidence--success',
  'trial-homestead--parley--failure',
  'trial-homestead--parley--success',
  'trial-tablelands--confront--failure',
  'trial-tablelands--confront--success',
  'trial-tablelands--evidence--failure',
  'trial-tablelands--evidence--success',
  'trial-tablelands--parley--failure',
  'trial-tablelands--parley--success',
  'trial-verge--confront--failure',
  'trial-verge--evidence--failure',
  'trial-verge--evidence--success',
  'trial-verge--parley--failure',
  'two-empty-buckets--carry-buckets--failure',
  'two-empty-buckets--carry-buckets--success',
  'two-empty-buckets--follow-missing--failure',
  'two-empty-buckets--follow-missing--success',
  'voices-across-the-rock--signal-a-safe-meeting-point--failure',
  'voices-across-the-rock--signal-a-safe-meeting-point--success',
  'voices-across-the-rock--trace-the-true-echo--failure',
  'voices-across-the-rock--trace-the-true-echo--success',
  'weighed-in-salt--test-the-counterweights--failure',
  'weighed-in-salt--test-the-counterweights--success',
  'weighed-in-salt--trade-supplies-for-passage--failure',
  'weighed-in-salt--trade-supplies-for-passage--success',
]

const paintedOutcomes = new Set(BESPOKE_OUTCOMES)

export function outcomeKey(
  cardId: string,
  choiceId: string,
  success: boolean,
): string {
  return cardId + '--' + choiceId + '--' + (success ? 'success' : 'failure')
}

export function outcomeArt(
  cardId: string,
  choiceId: string,
  success: boolean,
): string | null {
  const key = outcomeKey(cardId, choiceId, success)
  return paintedOutcomes.has(key) ? OUTCOME + key + '.webp' : null
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
