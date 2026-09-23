// /utils/seeds/facetEmbodimentValues.ts
//
// The embodiment vocabulary: AGE, BUILD, HAIR and ORIGIN.
//
// Silas, 2026-09-15: "When we develop a character, say for a dream digest,
// there are lots of factors that could be switched. Hair color, style, age,
// gender presentation, body shape, size, racial background, default emotional
// state ... It would be great if we could utilize something so there is more
// diversity automatically roled when creating characters without such
// guidance."
//
// WHY THIS FILE EXISTS
//
// The catalog was deep on what a character IS -- 176 GENRE, 208 PERSONALITY,
// 167 ARCHETYPE, 143 ANIMAL, 95 SPECIES -- and held nothing at all about what
// a character LOOKS like. Generators rolled the first set and invented the
// second unaided. Measured across all 98 authored Daily Dream characters:
//
//   saturated hair colour     0.0%      long hair                 0.0%
//   hair mentioned at all    23.5%      explicit age             14.3%
//   human skin tone           9.2%      stated affect            14.3%
//   she/her 39.8%  vs  he/him 9.2%  vs  they/them 3.1%
//
// Every axis the seed plan rolled came out varied. Every axis it did not roll
// collapsed to a single value: "a wiry woman in a patched coat with
// close-cropped grey hair and a scar." Diversity was never a prompting
// problem, it was a missing seed.
//
// SCOPE, AND THE WALRUS PROBLEM
//
// Most characters in this catalog are not human. An axis applied to the wrong
// body produces nonsense -- a "southeast asian walrus" applies a human
// phenotype label to an animal. Every entry therefore declares a `scope`:
//
//   'any'       works on any body at all (an elderly walrus is fine)
//   'humanoid'  needs human-shaped anatomy (box braids need hands and head hair)
//   'creature'  needs fur, feathers, scale or shell (a brindled coat)
//
// ORIGIN is the axis that makes this work. It is CULTURE, never phenotype, and
// so it is 'any': a walrus raised in a Lisbon-facing trade quarter wears that
// quarter's oilcloth and swears by its saints. It does not have its people's
// cheekbones. Humanoid complexion is DERIVED from ORIGIN by the author, which
// is why there is no COMPLEXION or ETHNICITY taxonomy here -- a standalone
// phenotype table rolled per character is precisely the shape that tokenizes.
// Silas's own practice is the model: blend one or two places of origin and let
// the look follow, rather than reading a race off a list.
//
// THE ANTI-STEREOTYPE RULE, which every ORIGIN description below obeys:
//
//   An ORIGIN may shape MATERIAL SPECIFICS ONLY -- a textile, a dish, a craft,
//   a tool, a script, a way of wearing something, a naming convention. It may
//   NEVER shape temperament, morality, intelligence, or competence. Those roll
//   independently on PERSONALITY and ALIGNMENT, and the whole point of rolling
//   them separately is that origin must not predict them.
//
// Regions are named at a deliberately even granularity. A harbour district in
// Lagos gets the same resolution as one in Lisbon; nothing here is "Africa" or
// "the East" against someone else's named street. Uneven resolution is how a
// list like this goes wrong even when every individual entry reads fine.

export type EmbodimentScope = 'any' | 'humanoid' | 'creature'

export type EmbodimentFacetSeed = {
  title: string
  description: string
  artPrompt: string
  scope: EmbodimentScope
  /** Relative draw weight. Below 1 makes an entry a rarer flavour. */
  weight?: number
}

export type EmbodimentTaxonomySeed = {
  taxonomy: 'AGE' | 'BUILD' | 'HAIR' | 'ORIGIN'
  groupKey: string
  groupLabel: string
  /** How many of these a single character should normally draw. */
  drawCount: number
  values: EmbodimentFacetSeed[]
}

// ---------------------------------------------------------------------------
// AGE -- life stage. Scope 'any': every body has a life stage.
// ---------------------------------------------------------------------------

const AGE: EmbodimentFacetSeed[] = [
  {
    title: 'Barely Grown',
    description:
      'Old enough to hold the post and too new to have been wrong in it yet. The confidence is real and entirely untested.',
    artPrompt:
      'A teenager seen from head to shoes, smooth-faced and gangly, wearing an oversized hand-me-down coat taken in at the seams, standing slightly too straight.',
    scope: 'any',
  },
  {
    title: 'Young and Overqualified',
    description:
      'Early twenties with a decade of practice already behind them, because they started far too early. Skill outruns standing.',
    artPrompt:
      'A young face over work-hardened hands, calluses that do not match the age, sleeves rolled past scarred forearms.',
    scope: 'any',
  },
  {
    title: 'Late Twenties',
    description:
      'Fully trained, not yet senior, and doing most of the actual work. The first real fatigue has arrived and is being ignored.',
    artPrompt:
      'A clear-featured adult face, faint shadow under the eyes, working clothes still in good repair.',
    scope: 'any',
  },
  {
    title: 'Thirties, Mid-Career',
    description:
      'Deep enough in to be relied on and not far enough to delegate. Competence has become the trap.',
    artPrompt:
      'An adult face with the first fine lines at the outer eye, hair kept practical, sleeves permanently pushed up.',
    scope: 'any',
  },
  {
    title: 'Solidly Middle-Aged',
    description:
      'Forties into fifties, with the body starting to send invoices for earlier decades. Knows exactly which joint will complain.',
    artPrompt:
      'A lined face, softened jaw, grey coming in unevenly, one knee visibly favoured in how the weight is set.',
    scope: 'any',
  },
  {
    title: 'Late Middle Age',
    description:
      'Fifties into sixties and at the height of authority, with retirement close enough to be a threat rather than a promise.',
    artPrompt:
      'Deep expression lines, thinning or silvering hair, reading glasses pushed up, hands beginning to show their tendons.',
    scope: 'any',
  },
  {
    title: 'Freshly Elderly',
    description:
      'Newly old and still adjusting to being treated as such. Does more than anyone expects and resents being helped.',
    artPrompt:
      'White or silver hair, softened features, hands showing prominent veins and swollen knuckles, back still straight.',
    scope: 'any',
  },
  {
    title: 'Genuinely Ancient',
    description:
      'Far past the age anyone in this line of work reaches, and still here. Outlasting everyone has become the achievement.',
    artPrompt:
      'A deeply seamed face, clouded eyes, sparse fine white hair, hands knotted at every joint, body settled and shrunken.',
    scope: 'any',
  },
  {
    title: 'Aged Out of Order',
    description:
      'Visibly older than the years account for, from work, weather, or something that took payment in advance.',
    artPrompt:
      'A young person seen from head to boots, smooth-jawed and slight, with prematurely white hair and weather-cracked skin on the hands and cheeks, their gaze heavy and tired.',
    scope: 'any',
  },
  {
    title: 'Unnervingly Unaged',
    description:
      'Decades in the same post with nothing to show for them. Colleagues have retired; this one has not changed at all.',
    artPrompt:
      'A smooth, unlined face wearing clothes two generations out of fashion, entirely at ease in them.',
    scope: 'any',
    weight: 0.6,
  },
  {
    title: 'Adolescent and Enormous',
    description:
      'Not yet grown and already larger than every adult present. Still growing into limbs that arrived early.',
    artPrompt:
      'An adolescent face on an outsized body, wrists and ankles past the ends of the sleeves, movements not yet settled.',
    scope: 'any',
  },
  {
    title: 'Old for the Species',
    description:
      'Elderly by their own kind’s reckoning and unremarkable by anyone else’s, which nobody outside ever accounts for.',
    artPrompt:
      'Greying muzzle or faded crest, clouded eye, worn-down claws or teeth, coat thinned at the flanks.',
    scope: 'creature',
  },
]

// ---------------------------------------------------------------------------
// BUILD -- shape and size. Scope 'any': every body has a build.
//
// Never the word "frame" for a body, however naturally it reads here. Krea
// paints it as a picture frame and the body vanishes -- "Wasted but Working"
// and "Rebuilt" both came back as an empty gilt frame (ArtJobs 30116/30117,
// 2026-09-21). server/utils/artPromptContract.ts now rejects it outright.
// ---------------------------------------------------------------------------

const BUILD: EmbodimentFacetSeed[] = [
  {
    title: 'Broad and Soft',
    description:
      'Wide through the body with the strength carried under a comfortable layer rather than on display. Underestimated constantly.',
    artPrompt:
      'A wide, softly rounded body, full upper arms, clothing cut generously and worn loose.',
    scope: 'any',
  },
  {
    title: 'Fat and Fast',
    description:
      'Heavy, and quicker off the mark than anyone braces for. The speed is the part people get wrong.',
    artPrompt:
      'A large round-bellied body caught mid-stride, weight forward, surprisingly light on the feet.',
    scope: 'any',
  },
  {
    title: 'Thick Through the Middle',
    description:
      'Built around a low, solid centre of gravity. Very hard to move and entirely aware of it.',
    artPrompt:
      'A short, deep-bodied build planted wide, thick waist, heavy through the thigh, feet set apart.',
    scope: 'any',
  },
  {
    title: 'Tall and Heavy',
    description:
      'Large in every direction and takes up the room accordingly. Has learned to sit down early in conversations.',
    artPrompt:
      'A very tall, wide-shouldered figure stooping slightly under a doorway, clothes straining at the shoulder seam.',
    scope: 'any',
  },
  {
    title: 'Small and Dense',
    description:
      'Short, compact and heavier than the size suggests. Lifts things that embarrass larger people.',
    artPrompt:
      'A short, thickly built figure with heavy forearms and a deep chest, sleeves cut short to clear the arms.',
    scope: 'any',
  },
  {
    title: 'Very Small',
    description:
      'Genuinely tiny beside everyone else, and long since done finding that remarkable. The world is the thing built wrong.',
    artPrompt:
      'A small figure dwarfed by ordinary furniture, standing on a stool worn smooth from constant use.',
    scope: 'any',
  },
  {
    title: 'Long and Angular',
    description:
      'All length and joint, folding rather than bending. Never entirely fits the chair provided.',
    artPrompt:
      'An elongated body with prominent elbows and knees, limbs folded awkwardly, sleeves ending short of the wrist.',
    scope: 'any',
  },
  {
    title: 'Athletic and Ordinary',
    description:
      'Strong in a plain, worked-for way that photographs as nothing special. Outlasts more impressive builds.',
    artPrompt:
      'An unremarkable sturdy body, visible forearm tendon, plain work clothes, nothing exaggerated.',
    scope: 'any',
  },
  {
    title: 'Soft-Bodied Scholar',
    description:
      'Built by decades of sitting still. Fitness was never the point and never will be.',
    artPrompt:
      'A rounded, unmuscled body, sloped shoulders, ink-stained fingers, a stoop set by years at a desk.',
    scope: 'any',
  },
  {
    title: 'Curved and Deliberate',
    description:
      'Full-figured and dressed to be exactly that, with nothing about it accidental.',
    artPrompt:
      'A full-hipped, full-chested figure in clothing cut to fit precisely, fabric following the shape rather than hiding it.',
    scope: 'any',
  },
  {
    title: 'Wasted but Working',
    description:
      'Reduced by illness or scarcity to less body than the job needs, still doing the job.',
    artPrompt:
      'A thin body with prominent collarbones and hollow cheeks, clothes hanging loose, grip nonetheless firm.',
    scope: 'any',
  },
  {
    title: 'Rebuilt',
    description:
      'A body substantially remade after damage, and not made to match what it was before.',
    artPrompt:
      'An asymmetric body, one limb visibly different in length or make, gait compensating in a settled, practised way.',
    scope: 'any',
  },
  {
    title: 'Uses a Wheeled Chair',
    description:
      'Moves seated, in a chair fitted precisely to them and maintained better than most vehicles.',
    artPrompt:
      'A well-worn custom wheelchair with hand-repaired spokes and taped push rims, its occupant leaning easily into a turn.',
    scope: 'humanoid',
  },
  {
    title: 'Walks With a Stick',
    description:
      'Takes a cane or crutch everywhere and has worn three of them out. The current one is the best yet.',
    artPrompt:
      'A figure resting real weight on a scuffed cane, grip polished dark by use, ferrule worn to an angle.',
    scope: 'humanoid',
  },
  {
    title: 'Massive and Slow',
    description:
      'Enormous, unhurried, and arrives when it arrives. Hurrying has never once been worth it.',
    artPrompt:
      'A huge bulk filling the space, thick limbs, deliberate weight-shift mid-step, ground compressed underfoot.',
    scope: 'creature',
  },
  {
    title: 'Overlong in the Limb',
    description:
      'Proportioned wrong for the space, with reach far past what anyone standing nearby has accounted for.',
    artPrompt:
      'A body with disproportionately long limbs folded in tight, reach extending well past the edge of the scene.',
    scope: 'creature',
  },
]

// ---------------------------------------------------------------------------
// HAIR -- colour, length, texture, styling. Written to cover fur, plumage and
// crest as well as head hair, because most characters here are not human.
// ---------------------------------------------------------------------------

const HAIR: EmbodimentFacetSeed[] = [
  {
    title: 'Waist-Length and Loose',
    description:
      'Long enough to be a genuine hazard around machinery, and worn down anyway. The refusal is the statement.',
    artPrompt: 'Very long hair worn loose past the waist, moving separately from the body.',
    scope: 'humanoid',
  },
  {
    title: 'Oiled and Coiled Up',
    description:
      'Long hair dressed, oiled and pinned close every single morning, a ritual that predates the current job.',
    artPrompt:
      'Dark hair oiled to a high shine, coiled and pinned at the nape, secured with plain metal pins.',
    scope: 'humanoid',
  },
  {
    title: 'Box Braids to the Shoulder',
    description:
      'Sectioned and braided in a sitting that took most of a day, and good for weeks of hard work afterward.',
    artPrompt:
      'Neat sectioned box braids falling to the shoulder, scalp parted in clean squares, ends sealed.',
    scope: 'humanoid',
  },
  {
    title: 'Locs, Long Maintained',
    description:
      'Years of growth carried as a visible record of time. Nothing about them is recent.',
    artPrompt:
      'Mature locs hanging heavy past the shoulders, thickened at the ends, a few wrapped in worn thread.',
    scope: 'humanoid',
  },
  {
    title: 'Tight Coils Grown Out',
    description:
      'Dense natural coils worn full and unstraightened, shaped rather than tamed.',
    artPrompt:
      'A full rounded cloud of tight coils, dense and springy, catching light at the outer edge.',
    scope: 'humanoid',
  },
  {
    title: 'Shaved to the Scalp',
    description:
      'Taken down to nothing, for heat, for hygiene, or because someone else once controlled it.',
    artPrompt:
      'A person seen from head to shoulders with a cleanly shaved head, the scalp smooth and even-toned, a thin pale scar curving above one ear.',
    scope: 'humanoid',
  },
  {
    title: 'Half Shaved, Half Long',
    description:
      'One side to the skin and the other left full, cut at home with a mirror and no assistance.',
    artPrompt:
      'An asymmetric cut, one side shaved to stubble, the other falling long past the jaw.',
    scope: 'humanoid',
  },
  {
    title: 'Dyed a Colour That Does Not Occur',
    description:
      'Saturated, deliberate and maintained at real cost. Roots are touched up before anything else in the budget.',
    artPrompt:
      'Hair, fur or plumage in a vivid unnatural colour — magenta, jade or electric blue — saturated to the ends, roots freshly done.',
    scope: 'any',
  },
  {
    title: 'Faded Rainbow',
    description:
      'Several colours laid over each other and grown out at different rates, so it now reads as a timeline.',
    artPrompt:
      'Multi-coloured hair or fur in soft bands of faded pink, green and violet, the natural colour showing through at the roots.',
    scope: 'any',
  },
  {
    title: 'One Streak, Deliberate',
    description:
      'Otherwise ordinary hair carrying a single bright stripe, kept up for years past whatever started it.',
    artPrompt:
      'Dark hair or fur with one saturated coloured streak at the front, sharply bounded, freshly maintained.',
    scope: 'any',
  },
  {
    title: 'White Since Young',
    description:
      'Went white decades early and has been explaining it ever since. The explanation changes.',
    artPrompt:
      'Pure white hair or fur, thick and healthy rather than thinned, on a body showing no other sign of age.',
    scope: 'any',
  },
  {
    title: 'Salt and Pepper, Unevenly',
    description:
      'Greying in patches rather than all over, which reads as damage instead of age.',
    artPrompt:
      'Dark hair or fur greying in irregular patches, one side of the head gone fully white, the rest barely touched.',
    scope: 'any',
  },
  {
    title: 'Red, Aggressively Natural',
    description:
      'Genuinely red and constantly assumed to be dyed, a correction long since abandoned.',
    artPrompt:
      'Copper-red hair or fur, coarse and bright in direct light, the same tone repeated in the finer hair around the eyes.',
    scope: 'any',
  },
  {
    title: 'Sun-Bleached at the Ends',
    description:
      'Darker at the root and burned pale at the ends by years outdoors. Grows out and bleaches again.',
    artPrompt:
      'Dark at the roots and fading to brittle straw-pale ends, texture dry and roughened.',
    scope: 'any',
  },
  {
    title: 'Wrapped and Covered',
    description:
      'Kept under cloth in public as a matter of practice, and dressed with as much care underneath.',
    artPrompt:
      'A wound head-wrap in patterned cloth, tied at the nape, a little hair showing at the temple.',
    scope: 'humanoid',
  },
  {
    title: 'Elaborate and Impractical',
    description:
      'Structured into something that took help and cannot survive a working day. Worn anyway.',
    artPrompt:
      'Hair built into a tall structured shape, pinned and ornamented, already beginning to come down on one side.',
    scope: 'humanoid',
  },
  {
    title: 'Cut Badly, Recently',
    description:
      'Taken off in a hurry with the wrong tool. Something happened and the hair is the evidence.',
    artPrompt:
      'Unevenly hacked-off hair at irregular lengths, blunt cut ends, one section far shorter than the rest.',
    scope: 'humanoid',
  },
  {
    title: 'Thinning and Undisguised',
    description:
      'Visibly receding, with no arrangement made to hide it. The refusal to comb it over is itself a choice.',
    artPrompt:
      'A high receding hairline with sparse fine hair combed straight back, scalp clearly visible.',
    scope: 'humanoid',
  },
  {
    title: 'Brindled Coat',
    description:
      'Streaked irregularly in two tones so no two of their kind read alike at a distance.',
    artPrompt:
      'A brindled coat in irregular dark streaks over a lighter ground, pattern breaking the outline of the body.',
    scope: 'creature',
  },
  {
    title: 'Piebald Patches',
    description:
      'Blocked in hard-edged white and dark with no blending. Unmistakable from very far away.',
    artPrompt:
      'Sharply bounded patches of white and dark fur or feather, edges crisp, distribution asymmetric.',
    scope: 'creature',
  },
  {
    title: 'Iridescent Plumage',
    description:
      'Feathers that shift colour with the angle, so the colour depends entirely on where the viewer stands.',
    artPrompt:
      'Dark plumage flashing green and violet where light strikes it, colour shifting across the curve of the body.',
    scope: 'creature',
  },
  {
    title: 'Crest Raised and Dyed',
    description:
      'A natural crest kept raised and coloured by hand, maintained as deliberately as any hairstyle.',
    artPrompt:
      'A tall raised crest of feathers or spines, hand-dyed in saturated colour toward the tips, fanned upright.',
    scope: 'creature',
  },
  {
    title: 'Moulting Badly',
    description:
      'Caught mid-shed and looking dreadful about it. Deeply self-conscious and pretending otherwise.',
    artPrompt:
      'A coat or plumage shedding in ragged patches, bare skin showing through, loose tufts caught at the shoulder.',
    scope: 'creature',
  },
  {
    title: 'Scarred Bald in Places',
    description:
      'Old injury left permanent gaps where nothing grows back, and the gaps map the history.',
    artPrompt:
      'Smooth hairless scar tissue interrupting fur or feather in clean irregular patches, surrounding coat healthy.',
    scope: 'creature',
  },
]

// ---------------------------------------------------------------------------
// ORIGIN -- culture and place, never phenotype. Scope 'any' throughout: a
// non-human carries an origin as culture (dress, craft, food, oath, naming)
// with no implication whatsoever about their body.
//
// Every description below names MATERIAL SPECIFICS only. None names a
// temperament. That constraint is the entire reason this axis is safe to roll.
// ---------------------------------------------------------------------------

const ORIGIN: EmbodimentFacetSeed[] = [
  {
    title: 'Lisbon-Facing Trade Quarter',
    description:
      'A tiled harbour district of salt cod, oilcloth coats and shopfront saints. Names carry a mother’s surname before a father’s.',
    artPrompt:
      'Blue-and-white tilework, an oilcloth coat stiff with salt, a small enamelled saint pinned inside the collar.',
    scope: 'any',
  },
  {
    title: 'Lagos Harbour District',
    description:
      'A port ward of wax-print cloth, welded scrap repair and generator-lit night trade. Cloth is chosen to be recognised across a crowd.',
    artPrompt:
      'Bold wax-print cotton in high-contrast pattern, a hand-welded bracket repair, a clip-on work lamp.',
    scope: 'any',
  },
  {
    title: 'Highland Crofting Country',
    description:
      'Thin soil, stone dykes and hand-spun wool worked in the round. Everything owned is expected to be mended, not replaced.',
    artPrompt:
      'Heavy undyed wool knitted in cable, a horn button, a wool patch felted over a worn elbow.',
    scope: 'any',
  },
  {
    title: 'Mekong Delta Waterway',
    description:
      'Life conducted from boats, with floating markets and stilted houses. Everything is stowed, and nothing is left loose on a deck.',
    artPrompt:
      'A conical woven palm hat, indigo cotton worn soft, a coiled mooring line stowed in a tight flat spiral.',
    scope: 'any',
  },
  {
    title: 'Andean High Valley',
    description:
      'Terraced fields at altitude, backstrap weaving and freeze-dried tubers. Cloth encodes the valley it came from.',
    artPrompt:
      'A backstrap-woven band in dense geometric red and black, a knitted ear-flapped cap, a bundled carrying cloth.',
    scope: 'any',
  },
  {
    title: 'Great Lakes Fishing Town',
    description:
      'Freshwater docks, smoked whitefish and closed-down industry. Winter gear is kept in the vehicle from October.',
    artPrompt:
      'A quilted flannel jacket, insulated rubber boots, a thermos dented on one side, gloves clipped at the cuff.',
    scope: 'any',
  },
  {
    title: 'Kerala Backwater Parish',
    description:
      'Coir rope, coconut groves and church feast days. Meals are served on a leaf and eaten with the right hand.',
    artPrompt:
      'A white cotton wrap with a gold border, coir rope coiled at the hip, a small brass oil lamp.',
    scope: 'any',
  },
  {
    title: 'Sahelian Caravan Halt',
    description:
      'A stopping point on a long desert route, dealing in salt, leather and indigo-dyed cloth. Water is measured, never estimated.',
    artPrompt:
      'Indigo cloth staining the skin faintly blue, tooled leather straps, a stoppered gourd worn on a shoulder cord.',
    scope: 'any',
  },
  {
    title: 'North Sea Rig Town',
    description:
      'A town built on offshore work, three weeks on and three off. High-visibility gear is worn ashore out of habit.',
    artPrompt:
      'A high-visibility jacket faded to chalk, steel-toed boots, a laminated shift card still clipped to the chest.',
    scope: 'any',
  },
  {
    title: 'Oaxacan Market Town',
    description:
      'Cochineal and indigo dye, ground chile and clay comals. Market day organises the whole week.',
    artPrompt:
      'Deep cochineal-red embroidery on undyed cotton, a woven palm basket, hands stained dark at the fingertips.',
    scope: 'any',
  },
  {
    title: 'Hokkaido Cold Coast',
    description:
      'Sea ice, kelp drying racks and deep snow-country building. Doors are built to open inward for a reason.',
    artPrompt:
      'A quilted indigo work coat, kelp drying on a slatted rack, snow packed hard along a low eave.',
    scope: 'any',
  },
  {
    title: 'Anatolian Plateau Village',
    description:
      'Flat-roofed stone houses, flatbread baked on a domed iron, and carpets knotted through the winter.',
    artPrompt:
      'A knotted wool carpet in madder red, a domed iron griddle, a headscarf tied back off the face.',
    scope: 'any',
  },
  {
    title: 'Caribbean Windward Parish',
    description:
      'Hurricane-braced houses, saltfish and pepper, and shutters checked every single season.',
    artPrompt:
      'Painted timber shutters with heavy iron hooks, light cotton in saturated colour, a machete worn smooth at the handle.',
    scope: 'any',
  },
  {
    title: 'Baltic Timber Port',
    description:
      'Sawn softwood, tar and a long dark winter. Everything wooden is tarred before it is ever painted.',
    artPrompt:
      'Pine tar staining canvas dark brown, a felted wool cap, resin tacky on a glove.',
    scope: 'any',
  },
  {
    title: 'Pearl River Factory Belt',
    description:
      'Dormitory towns around precision manufacturing, where a shift is timed to the second and side-work fills the rest.',
    artPrompt:
      'An anti-static smock, a lanyard badge worn reversed, fingertips taped against solder burn.',
    scope: 'any',
  },
  {
    title: 'Rift Valley Cattle Country',
    description:
      'Herding across long distances, beadwork done by hand, and wealth counted in animals rather than currency.',
    artPrompt:
      'Dense beadwork collars in red, white and blue, a long herding stick worn pale at the grip, a draped cloth.',
    scope: 'any',
  },
  {
    title: 'Appalachian Hollow',
    description:
      'Steep ground, mine legacy and music kept by ear. Canning season is not optional.',
    artPrompt:
      'A patched canvas work coat, rows of home-canned jars, a fretted instrument worn through at the sound hole.',
    scope: 'any',
  },
  {
    title: 'Levantine Olive Terrace',
    description:
      'Stone terraces and trees older than the deeds to them. The pressing season sets the calendar.',
    artPrompt:
      'Olive-stained hands, a woven collecting net under a gnarled tree, a stone press wheel worn concave.',
    scope: 'any',
  },
  {
    title: 'Pacific Atoll Settlement',
    description:
      'A low island of ocean navigation, pandanus weaving and carefully rationed fresh water.',
    artPrompt:
      'Plaited pandanus matting, a shell-inlaid navigation stick chart, a sun-bleached cotton wrap.',
    scope: 'any',
  },
  {
    title: 'Danube Barge Family',
    description:
      'Raised aboard a working river barge, with school by correspondence and no fixed address on any form.',
    artPrompt:
      'A cramped painted wheelhouse, a bunk built into the hull curve, a river chart worn through at the folds.',
    scope: 'any',
  },
  {
    title: 'Rajasthani Desert Town',
    description:
      'Block-printed cotton, stepwell water discipline and mirror-worked cloth made to be seen at distance.',
    artPrompt:
      'Block-printed cotton in madder and indigo, small mirrors stitched into an embroidered panel, a long draped shawl.',
    scope: 'any',
  },
  {
    title: 'Patagonian Wind Country',
    description:
      'Wool, wind and enormous distances between neighbours. Everything is anchored or it is already gone.',
    artPrompt:
      'A wind-scoured leather jacket, a wide flat cap held under a chin cord, wool fleece caught on a wire fence.',
    scope: 'any',
  },
  {
    title: 'Ruhr Works Town',
    description:
      'Heavy industry and the allotment gardens that grew up beside it. The works closed; the gardens did not.',
    artPrompt:
      'A coal-dusted work jacket, a tended allotment plot behind chain-link, an enamelled works badge.',
    scope: 'any',
  },
  {
    title: 'Arctic Coast Settlement',
    description:
      'Sea mammal hunting, sewn skin clothing and light that arrives and leaves in bulk.',
    artPrompt:
      'Sinew-sewn skin clothing with a fur-ruffed hood, a snow knife, a low sun very close to the horizon.',
    scope: 'any',
  },
  {
    title: 'Nile Delta Farmland',
    description:
      'Irrigated silt, date palms and canal maintenance that everyone shares. The flood calendar governs everything.',
    artPrompt:
      'A long cotton work robe, silt dried pale on the ankles, a short curved hand sickle.',
    scope: 'any',
  },
  {
    title: 'Javanese Batik Quarter',
    description:
      'Wax-resist dyeing done in stages over weeks, with the pattern declaring exactly which workshop made it.',
    artPrompt:
      'Wax-resist patterned cloth in brown, cream and indigo, a small copper wax pen, a dye vat rim crusted dark.',
    scope: 'any',
  },
  {
    title: 'Border Town, Two Passports',
    description:
      'Grew up crossing daily, fluent in both sides and fully trusted by neither administration.',
    artPrompt:
      'Two worn document folders carried together, a coat cut in one country and mended in another.',
    scope: 'any',
  },
  {
    title: 'Diaspora, Second Generation',
    description:
      'Raised between a home never lived in and one never quite granted. Cooks one way and files paperwork the other.',
    artPrompt:
      'A mass-market coat over an heirloom textile worn as lining, a handwritten recipe card in another script.',
    scope: 'any',
  },
  {
    title: 'Displaced, Origin Unrecorded',
    description:
      'Moved young and without documentation, so the place of origin exists only as a few sensory details and a song.',
    artPrompt:
      'A single carried object of unclear provenance, carefully wrapped in cloth and kept far past its usefulness.',
    scope: 'any',
  },
  {
    title: 'Company Town, Third Generation',
    description:
      'Family bound to one employer since a grandparent signed. The company store ledger outlived the company.',
    artPrompt:
      'An issued uniform jacket with a stitched-over former name, a company scrip token worn smooth.',
    scope: 'any',
  },
]

export const EMBODIMENT_FACET_SEEDS: EmbodimentTaxonomySeed[] = [
  { taxonomy: 'AGE', groupKey: 'age', groupLabel: 'Age', drawCount: 1, values: AGE },
  { taxonomy: 'BUILD', groupKey: 'build', groupLabel: 'Build', drawCount: 1, values: BUILD },
  { taxonomy: 'HAIR', groupKey: 'hair', groupLabel: 'Hair, Fur & Plumage', drawCount: 1, values: HAIR },
  // Two, because a blend of places is what actually reads as a person rather
  // than a label. Silas's own practice: "I usually choose a blend of 1-2
  // countries of origin with an ethnicity wildcard ... it works to provide
  // diversity."
  { taxonomy: 'ORIGIN', groupKey: 'origin', groupLabel: 'Origin & Heritage', drawCount: 2, values: ORIGIN },
]

export const EMBODIMENT_TAXONOMIES = EMBODIMENT_FACET_SEEDS.map((entry) => entry.taxonomy)
