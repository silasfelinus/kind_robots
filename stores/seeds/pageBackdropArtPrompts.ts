// /stores/seeds/pageBackdropArtPrompts.ts
//
// Backdrop art for the pages, three breakpoint variants each.
//
// Silas, 2026-08-05: "the art for these backgrounds is a higher priority than
// the 3000 ish facets currently in the queue."
//
// THE ONE THING THAT MAKES BACKDROP ART DIFFERENT from every other batch in
// this repo: it is scenery, not a subject. UI sits on top of it — panels,
// toolbars, galleries — so the middle of the canvas has to stay quiet. A
// beautiful piece with a strong central focal point is a BAD backdrop, because
// the focal point lands underneath a card. Composition guidance below pushes
// interest to the edges and keeps the centre open, and that is the requirement
// most likely to be lost if someone rewrites these prompts.
//
// The three variants are genuinely different framings, not one image recropped.
// A phone gets a tall scene where the interest sits top and bottom; a desktop
// gets a wide one where it sits left and right. Recropping a landscape to 9:16
// throws away the sides, which is exactly where the composition put everything.

export type BackdropVariant = 'mobile' | 'tablet' | 'desktop'

export type PageBackdropArtPrompt = {
  requestId: string
  page: string
  variant: BackdropVariant
  title: string
  width: number
  height: number
  imagePath: string
  promptString: string
  negativePrompt: string
}

/**
 * The render lane. Silas, 2026-10-07: "I want better backgrounds. something
 * from an illustrious line. All that we have on our pages are kiddy shots."
 *
 * Arthemy Western Art v3.0 is the Illustrious checkpoint he picked as house
 * for the comic line on 2026-10-04 (conductor projects/comic-creator/docs/
 * checkpoints.md), run at its author's settings: Euler a, 30 steps, CFG 5.
 * Unlike Krea2, which carried the first two batches, an Illustrious model
 * reads tags and honours its negative prompt, so the contract below is
 * written as tags and the negative does real work.
 *
 * Pilot, 2026-10-07 (ArtJobs 34414-34422): "quiet open centre" as a tag
 * produced the opposite -- one-point-perspective corridors, a sun, a
 * jellyfish and a robot dead centre, all near-black. Centring and darkness
 * are now spelled out in the negative, where this lane can act on them, and
 * the scene moved ahead of the style so the page's own setting survives.
 *
 * Scenes here read best as concrete nouns, not mood prose: round 2 turned
 * bots' "conveyor rails" into a train platform and dreams' "shoals of
 * drifters" into one centred jellyfish (ArtJobs 34424-34429).
 */
export const BACKDROP_LANE = {
  checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
  steps: 30,
  cfg: 5,
  sampler: 'euler_ancestral',
  scheduler: 'karras',
} as const

/**
 * Canvas per variant, chosen to match the breakpoints the CSS actually
 * switches on (mobile <768, tablet 768-1023, desktop >=1024) and kept on SDXL
 * training buckets near one megapixel. The Krea2 sizes (up to 1152x1536) are
 * past what an SDXL model composes cleanly; it tiles the scene instead.
 */
const CANVAS: Record<
  BackdropVariant,
  { width: number; height: number; framing: string }
> = {
  mobile: {
    width: 768,
    height: 1344,
    framing:
      'vertical composition, asymmetrical composition, detail clustered at the top and bottom edges, empty floor and open sky through the middle',
  },
  tablet: {
    width: 896,
    height: 1152,
    framing:
      'portrait composition, asymmetrical composition, detail along the top edge and lower corners, open negative space in the middle',
  },
  desktop: {
    width: 1344,
    height: 768,
    framing:
      'panoramic composition, asymmetrical composition, rule of thirds, detail massed at the left and right edges, wide open negative space in the middle, horizon carried across the full width',
  },
}

/**
 * Shared house style.
 *
 * Deliberately restates the "quiet centre" rule that CANVAS.framing also
 * carries: it is the constraint a generator is most likely to drop, and saying
 * it twice is cheap insurance on a batch this size.
 *
 * BACKDROPS ARE UNPEOPLED. This used to read "...when any figures appear they
 * are small, distant and incidental to the setting, and across the set they
 * represent a diverse range of genders, races, ages, body sizes and body
 * shapes, mixing humans, robots, animal-like beings and original nonhuman
 * companions". Read by a person that is a restraint. Read by a diffusion model
 * it is forty words of people with no way to evaluate the "when" — so all 222
 * backdrops in the first batch rendered with a cast. voice-lab put a crowd of
 * faces in both side windows; servers filled the street with a few dozen
 * figures. Those are precisely the thirds where the composition guidance says
 * to put the interest, and precisely where the UI panels do not cover them.
 *
 * The casting policy itself is right and lives on, in `CAST_DIRECTION` for art
 * that actually has a cast. A page background is not that art. Same bug as the
 * Tidefortune Ladle on 2026-08-08 — see server/utils/artPromptContract.ts,
 * which now rejects this phrasing at enqueue.
 */
// Split in two on purpose. CONTRACT is what makes an image usable as a
// backdrop at all — scenery, quiet centre, unpeopled, unmarked — and no page
// may opt out of it. AESTHETIC is only the look, and a page whose content
// wants a different register can replace it (see PageSeed.aesthetic).
//
// The split exists because the alternative is a per-page override of the whole
// block, and the first thing such an override would silently drop is the
// unpeopled rule. That is the exact bug this file just shipped 222 times; it
// should not be one copy-paste away from returning.
//
// The unpeopled rule is scoped to PEOPLE, not to everything alive. Several
// scenes want fauna or props — jellyfish drifters on
// dreams, half-assembled robots on the workbenches of bots — and a blanket "no
// creatures, no robots" would fight the very scene it wraps.
//
// 2026-09-19: the unpeopled rule used to be spelled "no people, no figures, no
// characters, no faces, no crowd". Five people nouns, on an engine whose
// negative prompt is inert, is a cast list. The sentence that followed it --
// "an unpeopled setting waiting to be entered" -- is the only part of it that
// ever worked, so it is now the whole rule. Same for the focal-point line: a
// composition is described by what it does have.
const CONTRACT = `scenery, no humans, empty, environment art, wide angle, detailed environment, intricate background details, deserted setting, every surface bare and unmarked`

const QUALITY = `masterpiece, best quality, amazing quality, absurdres, very aesthetic`

const HOUSE_AESTHETIC = `western comics \\(style\\), graphic novel illustration, cinematic lighting, volumetric light, atmospheric perspective, rich varied colour palette, bold ink linework, painterly texture, sophisticated, highly detailed background`

const NEGATIVE_PROMPT = `lowres, worst quality, bad quality, low quality, jpeg artifacts, blurry, text, signature, watermark, logo, speech bubble, border, multiple views, 1girl, 1boy, solo, people, person, silhouette, crowd, character focus, close-up, symmetry, symmetrical composition, centered composition, one-point perspective, vanishing point, central light source, sun in center, glowing orb, chibi, cute, kawaii, childish, children's book, nursery, toy, pastel colors, flat colors, simple background, monochrome, underexposed, too dark, nsfw`

type PageSeed = {
  page: string
  title: string
  /** The setting. Written to survive all three framings. */
  scene: string
  /** Replaces HOUSE_AESTHETIC when a page needs a different visual register. */
  aesthetic?: string
  /**
   * Appended to NEGATIVE_PROMPT. For the thing a scene names that this lane
   * would otherwise blow up into a centred hero: bots' "robot" rendered one
   * giant mech, dreams' "jellyfish" one giant jellyfish (ArtJobs 34639-34644).
   */
  negative?: string
  /**
   * Render a variant on another variant's canvas and framing, so its slug
   * serves that art. 896x1152 is within a step of Illustrious's character
   * portrait bucket (832x1216), and on bots every tablet candidate put a
   * figure or machine dead centre -- eight of eight, two of them androids the
   * negative named outright (ArtJobs 34761-34762, 34795-34798). The 9:16
   * mobile canvas never did, so bots' tablet renders on it; the slug, file and
   * frontmatter stay tablet's, and the CSS covers the 3:4 viewport. Silas,
   * 2026-10-08, approved the same for the other pages whose tablet art came
   * back with a centred figure: academy, characters, coat-dance, scenarios,
   * memory.
   */
  canvasFor?: Partial<Record<BackdropVariant, BackdropVariant>>
}

/**
 * First batch: the destination pages.
 *
 * Scenes are hand-written per page rather than templated off frontmatter,
 * because the point of Stage 3 is that pages stop looking interchangeable.
 * Each is grounded in the page's own declared identity — its `room` and
 * `subtitle` in content/*.md — so the art agrees with what the page says it is
 * instead of with what I guessed it was.
 */
const PAGES: PageSeed[] = [
  // The `taskmaster` seed (Quest Workshop) was removed on 2026-09-14 with the
  // /taskmaster route it dressed (storybook/t-047). Its backdrop endpoint no
  // longer has a page declaring it, so verifyPageBackdrop.ts correctly read the
  // leftover seed as art queued to render nowhere.
  {
    page: 'dreams',
    title: 'Dreams — Dream Deck',
    scene:
      'outdoors, night sky, a floating deck of pale weathered wooden planks adrift above a sea of clouds, swirling violet and indigo nebula, starry sky, constellations, bioluminescent particles, tiny glowing jellyfish scattered far away near the horizon, surreal, ethereal, open starry sky through the middle',
    negative:
      'giant jellyfish, large jellyfish, close-up jellyfish, large creature, monster, pillar, pole, tower, obelisk',
  },
  {
    page: 'bots',
    title: 'Bots — Bot Factory',
    scene:
      'indoors, messy machine shop, clutter, many small objects on every surface, workbenches piled with mechanical parts along both side walls, shelves of gears, brass joints, circuit boards and toolboxes, copper pipes running up the walls, tools hanging on pegboards, blueprints pinned above the benches, tall factory windows with warm afternoon sunlight, drifting sparks, empty concrete floor in the middle',
    negative:
      'robot, mecha, humanoid robot, android, cyborg, power armor, hanging object, creature, giant object, centerpiece, sculpture, statue, spiral, coil, tentacle, glass tank, specimen jar, cylinder, column, pillar',
    canvasFor: { tablet: 'mobile' },
  },
  {
    page: 'characters',
    title: 'Characters — Character Gallery',
    scene:
      'A character gallery: a long warm hall with a high vaulted ceiling, framed empty portrait niches and draped fabric receding down both side walls, dust catching in shafts of light from clerestory windows. Costume stands, prop weapons and open wardrobe trunks sit against the walls. It reads as a place where many different people and creatures are about to be introduced.',
    canvasFor: { tablet: 'mobile' },
  },
  {
    page: 'rewards',
    title: 'Rewards — Reward Gallery',
    scene:
      'A reward vault: a treasury of open chests, hanging medallions, ribboned trophies and improbable trinkets glinting on shelves that run away to either side, lit by warm low lamplight and a scatter of floating sparks. Opulent and mysterious, more curiosity-cabinet than bank.',
  },
  {
    page: 'scenarios',
    title: 'Scenarios — Scenario Gallery',
    scene:
      'A scenario table: an enormous map-strewn planning table seen from a low angle in a warm study, with sculpted terrain, tiny standing figures, dice and reference books pushed to the edges, and tall shelves of bound volumes rising on both sides. Candlelight and a single green-shaded lamp. Anticipation of a story about to be played.',
    canvasFor: { tablet: 'mobile' },
  },
  {
    page: 'art',
    title: 'Art — Art Gallery',
    scene:
      "An artist's studio at dusk: broad windows, drifting dust, a wall of stacked canvases and drying prints to one side, jars of brushes and spattered palettes to the other, an easel angled out of the centre. Colour swatches and pinned studies cover the edges of the walls. Generous, lived-in, and mid-project rather than tidy.",
  },
  {
    page: 'storybook',
    title: 'Storybook',
    scene:
      'A storybook library: a towering round reading room where shelves curve away on both sides, an open book the size of a table rests off-centre, and pages lift and drift upward turning into birds and small scenes as they rise. Warm lamplight below, deep blue evening through a tall window. Everything converging into one unfolding story.',
  },
  {
    page: 'giftshop',
    title: 'Gift Shop',
    scene:
      'The gift shop at the end of the tour: warm crowded shelves of enamel pins, plush oddities, printed shirts on racks and postcard spinners lining both side walls, festoon lights strung overhead, an open doorway of daylight beyond. Rich, crowded and full of character, like a museum shop after hours.',
  },

  /*
   * Second batch. `index` leads it because it is the front door — the one page
   * every visitor sees, and the only one where a missing backdrop is a first
   * impression rather than a gap.
   */
  {
    page: 'index',
    title: 'Kind Robots — Dashboard Room',
    scene:
      'The dashboard room: a warm circular hall at golden hour with tall arched doorways set all around the wall, each opening onto a glimpse of somewhere different — a workshop, a night sky, a gallery, a garden. Worn wooden floor, a domed skylight above, motes drifting in the light. Welcoming and full of directions to go, with the middle of the room deliberately clear.',
  },
  {
    page: 'sanctuary',
    title: 'Sanctuary',
    scene:
      'A sanctuary garden at dusk: a sheltered walled courtyard of soft greenery, a still reflecting pool off-centre, climbing vines and hanging lanterns along both walls, low stone benches at the edges. Butterflies drift through the warm air. Quiet, safe and unhurried — the calmest scene in the set.',
  },
  {
    page: 'academy',
    title: 'Art Academy',
    scene:
      'An art academy studio: a high-windowed atelier with plaster casts and anatomical models on shelves down one side, easels and stools ranged along the other, master studies pinned in rows on the far wall. Cool north light, chalk dust in the air, a faint smell of turpentine implied. Studious and generous rather than austere.',
    canvasFor: { tablet: 'mobile' },
  },
  {
    page: 'coloring',
    title: 'Coloring Book',
    scene:
      'A coloring table seen from above and slightly off-centre: a big paper-strewn work surface where line-art pages, fat wax crayons, pencil stubs and half-filled palettes spread to the edges, some pages still pure black-and-white outline and others blazing with colour. Bright, tactile and childlike without being twee.',
  },
  {
    page: 'stories',
    title: 'Stories — Story Maker Room',
    scene:
      'A multiverse of doors: a vast soft-lit space where dozens of freestanding doorframes float at different depths and angles, each ajar on a sliver of a different world — snow, neon, jungle, deep sea. Mist below, warm light above, the doors clustering to the left and right and thinning through the middle.',
  },
  {
    page: 'conductor',
    title: 'Conductor Cockpit',
    scene:
      'A conductor cockpit: a wide dim control room with a curved bank of glowing schedule boards, plotting tables and brass instruments arranged along both flanks, cables looping overhead, a tall window onto a night landscape ahead. Focused, technical and calm — a place for watching many things at once.',
  },
  {
    page: 'giving',
    title: 'Giving & Support',
    scene:
      'A giving hall: a warm open room where long tables of carefully packed parcels and supplies recede to either side, ribbon and twine spools at the edges, an open double door spilling afternoon light. Generous, practical and unsentimental — the work of helping, not a symbol of it.',
  },
  {
    page: 'resources',
    title: 'Resources — Resource Gallery',
    scene:
      'A resource archive: a long hall of card-catalogue drawers, labelled canisters and spooled reels on deep shelves running away down both walls, rolling ladders on rails, a reading lectern at the near edge. Cool, ordered and quietly enormous.',
  },
  {
    page: 'serendipity',
    title: 'Serendipity — Story Door',
    scene:
      'The story door: a single ornate doorway standing free in a soft twilight meadow, its frame carved with small creatures, light spilling warm from the gap where it stands ajar. Tall grass and fireflies at the lower edges, deep blue sky above. Inviting and a little mysterious, with the space around the door left open.',
  },
  {
    page: 'about',
    title: 'About — The Workshop Door',
    scene:
      'A welcoming studio entryway at dawn: a cracked-open door onto a sunlit workshop of half-built robots, paper birds and warm brass lamps, with ivy at the threshold and a hand-lettered welcome sign. Inviting and unpretentious.',
  },
  {
    page: 'account',
    title: "Account — The Keeper's Desk",
    scene:
      'A quiet study nook with a leather ledger, a ring of small brass keys, a cup of tea going cold, and a window onto soft evening rooftops. Orderly, private and calm.',
  },
  {
    page: 'achievements',
    title: 'Achievements — The Trophy Conservatory',
    scene:
      'A glass conservatory of ribboned medals and small sculpted trophies on floating shelves, sunlight refracting through hanging prisms, laurel vines climbing the frames. Celebratory but unshowy.',
  },
  {
    page: 'admin',
    title: 'Admin — The Signal Tower',
    scene:
      'A calm control loft of brass dials, patch cables and softly blinking status lamps, tall windows onto a night city. Competent and unalarming.',
  },
  {
    page: 'animation-manager',
    title: 'Animation — The Flipbook Theatre',
    scene:
      'A small theatre of suspended film strips and flipbook pages caught mid-turn, a projector throwing soft light onto a screen at the edge, dust motes in the beam. Mechanical and cinematic.',
  },
  {
    page: 'appmaker',
    title: 'Appmaker — The Assembly Bench',
    scene:
      'A lamplit maker bench strewn with modular tiles, blueprints and glowing wireframe shapes assembling themselves midair, tools racked neatly on a pegboard wall. Inventive and tidy.',
  },
  {
    page: 'artjob',
    title: 'Art Queue — The Kiln Room',
    scene:
      'A warm kiln room where framed canvases move slowly along a wooden rail, some still blank, some glowing as they finish. Ledgers and numbered tags hang at the sides. Patient industry.',
  },
  {
    page: 'brainstorm',
    title: 'Brainstorm — The Idea Storm',
    scene:
      'A tall airy loft where sticky notes, chalk sketches and paper aeroplanes swirl on a strong indoor draught, lightning-bug sparks of inspiration drifting near the ceiling. Energetic, not chaotic.',
  },
  {
    page: 'cart',
    title: 'Cart — The Packing Room',
    scene:
      'A shipping room of brown-paper parcels, twine spools, stamps and a wooden counter, a cat asleep on a stack of boxes, warm lamplight. Homely commerce.',
  },
  {
    page: 'challenges',
    title: 'Challenges — The Trial Grounds',
    scene:
      'A sunlit training yard of rope courses, targets and chalked circles, banners snapping, mountains beyond. Spirited and sporting.',
  },
  {
    page: 'chats',
    title: 'Chats — The Long Table',
    scene:
      'A convivial long table under strung lights in a courtyard, mismatched chairs, teapots and open notebooks, conversation implied by empty seats. Warm and social.',
  },
  {
    page: 'coat-dance',
    title: 'Coat Dance — The Cloakroom Ball',
    scene:
      'indoors, deserted cloakroom of a grand ballroom at night, a long polished wooden counter along the left wall, rows of empty brass hooks and numbered brass tags on the walls, velvet ropes, an open archway on the right onto a moonlit ballroom with dimmed crystal chandeliers and polished parquet, elegant and uncanny',
    negative:
      'person, figure, standing figure, walking figure, mannequin, dancer, back view, cloak, hood, robe, coat, gown, red coat',
    canvasFor: { tablet: 'mobile' },
  },
  {
    page: 'conductor-app',
    title: 'Conductor — The Signal Room',
    scene:
      'An orchestral signal room where lines of light run from a central podium out to distant workshops, batons and score sheets on a stand. Coordinating many hands.',
  },
  {
    page: 'dashboard',
    title: 'Dashboard — The Observatory Deck',
    scene:
      'A brass observatory deck with orreries, charts and a wide balcony over a lantern-lit valley at blue hour. Overview and calm command.',
  },
  {
    page: 'error',
    title: 'Error — The Detour',
    scene:
      'A misty crossroads at dusk with a weathered signpost pointing several ways and a lantern-lit cart. Mysterious but reassuring.',
  },
  {
    page: 'facets',
    title: 'Facets — The Lapidary Bench',
    scene:
      'A lapidary workbench of loupe, tweezers and half-cut stones catching light, drawers of labelled specimens behind. Precise and tactile.',
  },
  {
    page: 'for-you',
    title: 'For You — The Gift Table',
    scene:
      'A table laid with wrapped parcels chosen just so, a hand-written tag on each, morning light and a vase of cut flowers. Personal and thoughtful.',
  },
  {
    page: 'forum',
    title: 'Forum — The Amphitheatre',
    scene:
      'A sunlit stone amphitheatre ringed with olive trees, cushions on the steps, banners at the rim. Open discussion, no podium.',
  },
  {
    page: 'friends',
    title: 'Friends — The Porch',
    scene:
      'A wide wooden porch at golden hour with rocking chairs, lemonade, a dog asleep, fields beyond. Easy companionship.',
  },
  {
    page: 'hair-studio',
    title: 'Hair Studio — The Styling Parlour',
    scene:
      'An art-deco styling parlour with mirrors ringed in warm bulbs, ribbons and combs on marble, potted ferns and a tall window onto a neon-lit evening street. Glamorous and sultry.',
  },
  {
    page: 'home',
    title: 'Home — The Hearth',
    scene:
      'A warm living hall with a lit hearth, deep armchairs, shelves of curios and a robot dozing on a rug, snow drifting past mullioned windows. Safe and welcoming.',
  },
  {
    page: 'humboldt-scoop',
    title: 'Humboldt Scoop — The Coast Desk',
    scene:
      'A weathered newsroom desk facing fogged redwood coast, typewriter, coffee, tide charts pinned to the wall. Local and grounded.',
  },
  {
    page: 'memory',
    title: 'Memory — The Card Hall',
    scene:
      'A hall of face-down cards floating in neat ranks, a few flipped to show tiny glowing scenes, candlelight. Tense concentration.',
    canvasFor: { tablet: 'mobile' },
  },
  {
    page: 'messages',
    title: 'Messages — The Pigeon Loft',
    scene:
      'A timber pigeon loft at dawn, cubbies of folded notes, birds arriving and leaving through open shutters, straw and soft light. Anticipatory.',
  },
  {
    page: 'model-builder',
    title: 'Model Builder — The Armature Shop',
    scene:
      "A sculptor's shop of wire armatures, clay maquettes and calipers, north light through dusty glass. Constructive and hands-on.",
  },
  {
    page: 'navigation',
    title: 'Navigation — The Compass Rose',
    scene:
      'A stone floor inlaid with a huge compass rose, corridors radiating outward under arches, lanterns marking each way. Orientation made beautiful.',
  },
  {
    page: 'newsfeed',
    title: 'Newsfeed — The Press Room',
    scene:
      'A print room of hanging galley proofs, ink rollers and a wall of pinned dispatches, morning light through high windows. Current and busy.',
  },
  {
    page: 'plan',
    title: 'Plan — The Drafting Hall',
    scene:
      'A high drafting hall of tilted tables, pinned schematics, string-and-pin planning boards and tall north windows. Focused and unhurried.',
  },
  {
    page: 'play',
    title: 'Play — The Arcade Garden',
    scene:
      'An outdoor arcade among flowering trees: cabinets and games glowing under paper lanterns at dusk, confetti drifting. Joyful and inviting.',
  },
  {
    page: 'privacy',
    title: 'Privacy — The Safe Room',
    scene:
      'A panelled reading room with a heavy door ajar, curtains drawn, a single lamp and a locked box on the desk. Discreet and trustworthy.',
  },
  {
    page: 'project-placement',
    title: 'Project Placement — The Sorting Hall',
    scene:
      'A hall of labelled pigeonholes and a long sorting bench, folders in mid-flight to their slots. Methodical.',
  },
  {
    page: 'register',
    title: 'Register — The Threshold',
    scene:
      'An open iron gate onto a sunlit path through tall wildflowers, a welcome arch and a book on a stand. Beginning and invitation.',
  },
  {
    page: 'reset-password',
    title: 'Reset — The Locksmith',
    scene:
      "A locksmith's bench of key blanks, files and an open lock mechanism, warm focused lamplight. Repair, not alarm.",
  },
  {
    page: 'ruler-hooked',
    title: 'Ruler Hooked — The Measure Room',
    scene:
      'A room of hanging rulers, plumb lines and brass gauges catching light, a drafting stool below. Exacting and quiet.',
  },
  {
    page: 'sanctuary-hub',
    title: 'Sanctuary — The Quiet Grove',
    scene:
      'A still grove of tall pale trees around a mirror pool, soft mist, drifting fireflies, a stone bench. Restful and reverent.',
  },
  {
    page: 'screenfx',
    title: 'Screen FX — The Effects Bay',
    scene:
      'A bay of lenses, gels and prisms throwing coloured light across a dark room, sparks and smoke curling. Showy and technical.',
  },
  {
    page: 'servers',
    title: 'Servers — The Engine Hall',
    scene:
      'A cathedral-scale engine hall of humming brass towers and cable runs, catwalks and status lamps in the dark. Powerful and orderly.',
  },
  {
    page: 'shop-cancel',
    title: 'Cancelled — The Turned Cart',
    scene:
      'A market cart turned back at a quiet lane, goods still neatly covered under oilcloth, a lantern left burning. Calm, no blame.',
  },
  {
    page: 'shop-success',
    title: 'Success — The Ribbon Cut',
    scene:
      'A parcel handed over with a ribbon cut, confetti in low sun, market bunting overhead. Celebratory and warm.',
  },
  {
    page: 'sketchy',
    title: 'Sketchy — The Sketch Wall',
    scene:
      'A studio wall papered edge to edge with loose gesture drawings, charcoal dust, a jar of stubs on a stool. Raw and generative.',
  },
  {
    page: 'stylist',
    title: 'Stylist — The Atelier',
    scene:
      'A couture atelier of bolts of fabric, dress forms, pinned muslin and tall mirrors, afternoon light. Refined and creative.',
  },
  {
    page: 'themes',
    title: 'Themes — The Paint Library',
    scene:
      'A library of pigment jars and swatch cards arranged by hue across a whole wall, a ladder on rails. Chromatic and calm.',
  },
  {
    page: 'user-admin',
    title: 'User Admin — The Registry',
    scene:
      'A registry room of card catalogues and a brass name-plate press, tall ledgers and a lamp. Careful record-keeping.',
  },
  {
    page: 'voice-lab',
    title: 'Voice Lab — The Sound Booth',
    scene:
      'A warm sound booth of felt panels, a vintage ribbon microphone, waveform light rippling on the glass. Intimate and acoustic.',
  },
  {
    page: 'wallet',
    title: 'Wallet — The Counting House',
    scene:
      'A counting house of brass scales, coin trays and a ledger under a green-shaded lamp, warm wood. Trustworthy and precise.',
  },
  {
    page: 'creator-earnings',
    title: 'Creator Earnings — The Tally Loft',
    scene:
      'A tally loft above a workshop floor: shelves of small labelled dishes each holding a handful of glowing tokens, an open ledger book catching lamplight on a slanted desk, taut strings running up from a few dishes to miniature models — a little robot, a book, a mask, a paintbrush — suspended from the rafters overhead. Warm brass fittings, motes of light drifting up from the tokens. Precise and quietly rewarding — a place where what you made is being counted, not yet paid out.',
  },
  {
    page: 'watchlist',
    title: 'Watchlist — The Screening Room',
    scene:
      'A small velvet screening room, projector beam through dark, reels stacked at the side, one seat turned out. Anticipatory and intimate.',
  },
]

function buildPrompt(seed: PageSeed, variant: BackdropVariant): string {
  return [
    QUALITY,
    CONTRACT,
    seed.scene,
    seed.aesthetic ?? HOUSE_AESTHETIC,
    CANVAS[variant].framing,
  ].join(', ')
}

export const pageBackdropArtPrompts: PageBackdropArtPrompt[] = PAGES.flatMap(
  (seed) =>
    (Object.keys(CANVAS) as BackdropVariant[]).map((variant) => {
      const canvasVariant = seed.canvasFor?.[variant] ?? variant
      const canvas = CANVAS[canvasVariant]
      return {
        // Stable and derived, never random: the enqueue script uses this to
        // recognise a job it already created, so re-running it is a no-op
        // rather than a second copy of the whole batch.
        requestId: `page-backdrop-${seed.page}-${variant}`,
        page: seed.page,
        variant,
        title: `${seed.title} (${variant})`,
        width: canvas.width,
        height: canvas.height,
        // Must match the frontmatter keys in content/<page>.md exactly, and the
        // /images/** redirect to the media origin.
        imagePath: `background/${seed.page}-${variant}.webp`,
        promptString: buildPrompt(seed, canvasVariant),
        negativePrompt: seed.negative
          ? `${NEGATIVE_PROMPT}, ${seed.negative}`
          : NEGATIVE_PROMPT,
      }
    }),
)
