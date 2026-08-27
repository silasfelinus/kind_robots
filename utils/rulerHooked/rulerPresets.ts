// utils/rulerHooked/rulerPresets.ts
//
// The twelve ruler cosmetic presets (ruler-hooked/t-020, approved by Silas
// 2026-08-26: "those rulers are better than my suggestions, no reason to stick
// with speciesism" + the four child rulers added the same session). This list
// mirrors conductor's `scripts/build_ruler_hooked_art_queue.py` RULER_PRESETS,
// which is the source of truth for the rendered art (id + prompt "look" text) —
// if a preset is added or renamed there, mirror the change here too. `title` is
// the character's own honorific from that pipeline (offered as a suggestion,
// never a constraint — ruler-hooked/t-021, Silas: "custom name and honorific").
//
// `HERO_RULER_PRESET_ID` matches conductor's `HERO_RULER_ID`: the one preset
// with an already-rendered dedicated layer (`ruler-fishing.webp`, t-018). Every
// other preset gracefully degrades to that same file until its own
// `ruler-<id>.webp` layer is rendered (compositor.ts's `fallbackState`).

export interface RulerPreset {
  id: string
  /** Suggested honorific — a starting point, not a constraint (t-021). */
  title: string
  /** Short description for alt text / picker tooltips. */
  look: string
}

export const RULER_PRESETS: RulerPreset[] = [
  {
    id: 'king-osric',
    title: 'King',
    look: 'A plump contented middle-aged monarch, deep brown skin, grey-streaked locs, a slightly-too-large crown worn askew.',
  },
  {
    id: 'queen-mabel',
    title: 'Queen',
    look: 'A tall broad-shouldered monarch in her fifties, close-cropped silver hair under a slim gold circlet, an embroidered fishing coat over her robes.',
  },
  {
    id: 'sovereign-wren',
    title: 'Sovereign',
    look: 'A lanky young androgynous monarch, dark hair shaved at the sides, the circlet worn loose around the throat, patched waders under a half-cape.',
  },
  {
    id: 'regent-halvard',
    title: 'Regent',
    look: 'A very old wiry monarch, a long white beard tucked into a belt, swimming in robes several sizes too big, a folding stool and a thermos.',
  },
  {
    id: 'matriarch-oshun',
    title: 'Matriarch',
    look: 'A short and gloriously round monarch, an enormous coiled crown of braided hair with the actual crown perched on top of it, beaded rings on every finger.',
  },
  {
    id: 'chieftain-brakka',
    title: 'Chieftain',
    look: 'A powerfully built orcish monarch, moss-green skin, small proud tusks, a crown of shed antlers, forearms like tree roots.',
  },
  {
    id: 'heron-queen-sedge',
    title: 'Queen',
    look: 'A tall heron-folk monarch, soft grey-blue plumage and a long elegant neck, the crown balanced between two head plumes, standing on one leg out of habit.',
  },
  {
    id: 'little-monarch-pip',
    title: 'Monarch',
    look: 'A tiny mouse-folk monarch barely taller than a boot, an enormous crown resting on both ears at once, seated on a stack of unread royal ledgers.',
  },
  {
    id: 'boy-king-tobin',
    title: 'King',
    look: 'A small boy king of about eight, a mop of red hair, a crown far too big for him pushed back off his forehead, feet swinging nowhere near the ground.',
  },
  {
    id: 'girl-queen-marisol',
    title: 'Queen',
    look: 'A small girl queen of about nine, two tight buns, a gap-toothed look of total concentration, a crown pinned firmly in place because she checked.',
  },
  {
    id: 'cub-prince-bramble',
    title: 'Prince',
    look: 'A bear-cub-folk child ruler, round and shaggy in brown fur, a circlet of woven river-reeds, enormous paws entirely unsuited to a delicate reel.',
  },
  {
    id: 'elder-tortoise-yew',
    title: 'Sovereign',
    look: 'An immensely old tortoise-folk sovereign, mossy shell and a kindly wrinkled face, a crown worn smooth by centuries, unhurried.',
  },
]

export const RULER_PRESET_IDS: string[] = RULER_PRESETS.map((p) => p.id)

export const RULER_PRESET_BY_ID: Record<string, RulerPreset> =
  Object.fromEntries(RULER_PRESETS.map((p) => [p.id, p]))

/** The one preset with an already-rendered dedicated layer (t-018/t-020). */
export const HERO_RULER_PRESET_ID = 'king-osric'

/**
 * The compositor "state" name for the ruler region's already-rendered layer
 * file (`ruler-fishing.webp`) — distinct from any preset id, kept as the
 * universal fallback until per-preset layers are rendered (see
 * compositor.ts's `assetCandidates` `fallbackState` param).
 */
export const RULER_LAYER_FALLBACK_STATE = 'fishing'
