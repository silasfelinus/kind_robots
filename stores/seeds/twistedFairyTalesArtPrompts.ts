// stores/seeds/twistedFairyTalesArtPrompts.ts
//
// Paired full-color and black-and-white prompt definitions for Coloring Book
// Book Three: Twisted Fairy Tales. Each entry is a standalone 1024x1536 image
// request. Never combine entries into a collage, grid, triptych, or contact sheet.

export type TwistedFairyTalesVariant = 'COLOR' | 'COLORING_PAGE'

export type TwistedFairyTalesArtPrompt = {
  requestId: string
  title: string
  conceptSlug: string
  variant: TwistedFairyTalesVariant
  width: 1024
  height: 1536
  imagePath: string
  sourceImages?: string[]
  promptString: string
  negativePrompt: string
}

type ConceptSeed = {
  slug: string
  title: string
  scene: string
  sourceImages?: string[]
}

const COLOR_STYLE = `Create one standalone full-color portrait illustration for Coloring Book Book Three: Twisted Fairy Tales. Final canvas: exactly 1024 x 1536 pixels, portrait orientation. Use the approved Kind Robots colored fine-detail style: mature young-adult graphic horror-comic art, playful darkness, expressive anatomy, a strong readable silhouette, thick clean black outer contours, medium-weight interior linework, flat bounded color, hard-edged graphic shadow shapes, and dense but organized storybook detail. Build the character, clothing, props, fur, architecture, and scenery from clearly separated enclosed shapes so the same composition can convert cleanly into an adult coloring page. Keep the palette vivid, slightly grimy, and theatrical rather than muddy. No gradients, soft airbrushing, painterly haze, photorealism, readable text, logos, watermarks, borders, panels, collage, contact sheet, or multiple alternate poses.`

const COLORING_STYLE = `Create one standalone black-and-white adult coloring-book illustration for Coloring Book Book Three: Twisted Fairy Tales. Final canvas: exactly 1024 x 1536 pixels, portrait orientation. Preserve the exact scene, pose, anatomy, facial expression, camera angle, costume, props, and background composition described below as though converting the approved colored master into line art. Use pure white paper and clean black ink only: bold outer contours, medium interior construction lines, fine decorative details, many clearly enclosed coloring regions, and varied open spaces. Replace all color and shadow masses with readable open line patterns. Avoid grayscale, halftones, gradients, filled shadows, muddy crosshatching, huge solid-black areas, painterly marks, readable text, logos, watermarks, borders, panels, collage, contact sheet, or multiple alternate poses.`

const NEGATIVE_PROMPT =
  'collage, grid, triptych, diptych, contact sheet, multiple poses, duplicate character, extra limbs, malformed hands, fused fingers, unreadable anatomy, text, caption, logo, watermark, border, photorealism, painterly blur, soft focus, low detail'

const concepts: ConceptSeed[] = [
  {
    slug: 'three-little-dead',
    title: 'The Three Little Dead',
    sourceImages: [
      '/images/bots/three-dead.webp',
      '/images/dreams/fractured-fairy-tales.webp',
    ],
    scene: `Show the established Three Little Dead as three reanimated zombie pigs narrating together in a crooked fairy-tale village. Preserve the recognizable trio from the current Kind Robots narrator art while upgrading them to the coloring-book production style. They wear distinct tattered overalls and each has a different personality: one wiry and suspicious clutching a bundle of rotten straw, one cocky and splintered carrying broken sticks like dueling clubs, and one broad bricklayer with a cracked masonry mallet and a strangely tender expression. Their ruined straw, stick, and brick cottages lean behind them beneath a patched moon. Add crooked fences, thorny vines, loose bricks, mushrooms, ravens, and little visual jokes, but keep the three pigs dominant and readable. They should be gross, funny, affectionate toward one another, and only mildly threatening—storybook corpses with enormous ensemble chemistry, not realistic gore.`,
  },
  {
    slug: 'red-riding-hood-threshold',
    title: 'Red Riding Hood: Defender at the Door',
    scene: `Frame Red Riding Hood in a close, dynamic half-torso action composition at her grandmother's cottage threshold. Red is a clearly adult young farm worker: still youthful, freckled, curvy, and tired, with practical muscle built by field labor and a hearty eggs-and-butter diet. Old scars on her arms, shoulder, and cheek show several close calls without making her glamorous suffering the point. She is unquestionably in charge. Her near hand thrusts a small chipped hand axe toward the viewer in dramatic foreshortening while the other steadies the door or sweeps her cloak aside. Her red hood and work-worn corset dress mix rural practicality with mall-goth attitude. Inside the open cottage, a long-clawed evil silhouette waits near the bed, but Red looks bored, focused, and ready to handle a familiar problem. Include her battered basket, wolfsbane, cottage hinges, ivy, mushrooms, and a few domestic details, keeping perspective and visual emphasis firmly on Red rather than the threat.`,
  },
  {
    slug: 'grandma-wolf-burlesque',
    title: 'Grandma Wolf: Headliner After Midnight',
    scene: `Show Grandma Wolf as an adult trans wolf burlesque headliner in her ornate backstage boudoir, framed from approximately the hips upward. She has a visibly masculine foundation—broad shoulders, strong neck, angular muzzle, heavy brow, powerful rib cage, large clawed hands, and confident forearms—paired with joyful, glamorous feminine presentation. Her structured corset creates an emphatic theatrical push-up effect and abundant bust, supported by visible boning, lace cups, jeweled straps, and a luxurious robe slipping from one shoulder. Her styled head fur, dramatic eye makeup, sculpted brows, earrings, pearls, and feather trim look fabulous rather than disguising who she is. She turns from a bulb-lined vanity with one eyebrow raised and a knowing smile, adjusting an earring or jeweled collar. Surround her with feather fans, perfume bottles, roses, makeup brushes, stage curtains, costume jewelry, and a discarded heel. She should radiate survival, humor, experience, and absolute comfort in her own skin.`,
  },
  {
    slug: 'undercover-muskrat-sting',
    title: 'The Muskrat Sting',
    scene: `Stage a darkly comic prostitution-sting arrest in a seedy fairy-tale roadside motel. The arresting officer is a clearly adult, tiny anthropomorphic muskrat with the tactile proportions of a small bean-filled plush collectible and the bold fashion attitude of a grown-up glam doll—never childlike. She wears an intentionally flashy undercover sex-worker persona over concealed police gear: tiny platform boots, a short faux-fur coat, dramatic earrings, fishnets, a glittery motel dress, a hidden badge, and a practical utility belt. Her larger adult suspect is a bulky, tattooed dark-puppet creature with battered plush-and-fur texture, somewhere between an alley monster and an old practical-effects fantasy villain. He is handcuffed in an awkward but non-graphic position against the edge of a rumpled motel bed while she braces one boot, grips the cuffs, and barely maintains control. He is stronger and heavier, but she has leverage, training, and stubborn determination. Include a buzzing lamp, cracked mirror, cheap floral bedspread, discarded room key, motel telephone, crooked blinds, and her backup radio. No nudity or explicit sexual act; the humor comes from the improbable size difference and hard-won arrest.`,
  },
  {
    slug: 'puss-cleans-up-nice',
    title: 'Puss Cleans Up Nice',
    scene: `Show an adult anthropomorphic Puss in Boots infiltrating a decadent royal masquerade. He is mangy, tattooed, sexy-ugly, and magnetic: scarred muzzle, torn ear, rough cheek fur, heavy-lidded eyes, crooked teeth, and the posture of a lifelong alley survivor who knows he is irresistible. Dress him in an extravagant stolen velvet coat, open enough to reveal chest fur and tattoos, with jeweled rings, earrings, layered chains, lace cuffs, a huge feathered hat, fitted trousers, and polished thigh-high boots. He raises a crystal goblet toward the viewer while secretly slipping a key or gemstone into his coat with the other paw. Tiny mice serve as accomplices around an overflowing banquet, while a suspicious palace dog watches. Add chandeliers, drapery, armor, fruit, roses, masks, and stairs, but keep Puss's swagger and forward boot as the dominant silhouette. The mood is filthy fairy-tale glamour and criminal confidence.`,
  },
  {
    slug: 'hansel-factory-gates',
    title: 'Hansel at the Factory Gates',
    scene: `Show Hansel and Gretel arriving at an enormous magical candy factory hidden in a dark forest. Hansel, a clearly adult young farmhand, dominates the foreground with hungry wonder as he reaches toward a sample offered by a smiling sugar creature. Gretel stands slightly behind him, already wary and studying the machinery. The factory combines gingerbread masonry, peppermint pipes, gumdrop smokestacks, licorice railings, frosting mortar, stained-sugar windows, syrup carts, and cheerful gingerbread workers. At first glance it is delightful; closer inspection reveals oven chimneys, child-sized footprints that stop at locked doors, warning symbols disguised as decorations, and workers whose smiles are a little too fixed. Keep both siblings readable and adult, with Hansel enchanted and Gretel observant. Use bright candy spectacle against sinister woods without losing clean enclosed shapes.`,
  },
  {
    slug: 'gretel-doesnt-trust-this-place',
    title: `Gretel Doesn't Trust This Place`,
    scene: `Place Gretel at the center of a magical candy-factory production floor. She is a clearly adult young farm woman with practical strength, rolled sleeves, worn boots, alert eyes, strong hands, and the posture of someone accustomed to protecting her brother from terrible ideas. In the foreground she studies a conveyor of nervous gingerbread workers and suspicious candy molds while hiding a small bread knife or iron oven tool behind her back. She notices what everyone else ignores: child-sized footprints ending near an oven corridor, bones mixed into sugar sacks, cages disguised as confection molds, cheerful decorations covering locks, and a row of framed former employees. Hansel appears deeper in the scene laughing with workers and eating candy, unaware of the danger. The machinery should be intricate and tempting, but Gretel's wary face and strong silhouette must control the page.`,
  },
  {
    slug: 'candy-witch-ceo',
    title: 'The Candy Witch, CEO',
    scene: `Show the adult witch who owns the magical candy factory as a charismatic industrial magnate. She combines glamorous executive, beloved confectioner, factory forewoman, and old storybook witch. Give her enormous spun-sugar hair studded with sweets, candy-colored cat-eye spectacles, stained gloves, a sharply tailored dark dress beneath a luxurious apron, jeweled oven keys, and a striped confectioner's-cane wand. She stands on a brass-railed platform above production lines, offering a tray of impossible treats while delighted children and candy creatures cheer below. Her smile is warm and convincing; the danger is in how effectively she has made everything feel wonderful. Behind her, include locked oven controls, ingredient jars with unsettling silhouettes, factory ledgers, portrait frames of former employees, syrup gauges, and gingerbread machinery. Keep her commanding full-body silhouette centered and theatrical, with bright sugar colors against grim industrial metal.`,
  },
]

function imagePath(slug: string, variant: TwistedFairyTalesVariant) {
  const suffix = variant === 'COLOR' ? 'color' : 'coloring'
  return `public/images/artcollections/twisted-fairy-tales/phase-one/${slug}-${suffix}.webp`
}

function buildPrompt(seed: ConceptSeed, variant: TwistedFairyTalesVariant) {
  const style = variant === 'COLOR' ? COLOR_STYLE : COLORING_STYLE
  return `${seed.scene}\n\n${style}`
}

export const twistedFairyTalesPhaseOnePrompts: TwistedFairyTalesArtPrompt[] =
  concepts.flatMap((seed) =>
    (['COLOR', 'COLORING_PAGE'] as const).map((variant) => ({
      requestId: `twisted-fairy-tales-${seed.slug}-${variant.toLowerCase()}`,
      title: `${seed.title} — ${variant === 'COLOR' ? 'Color Detail' : 'Coloring Page'}`,
      conceptSlug: seed.slug,
      variant,
      width: 1024 as const,
      height: 1536 as const,
      imagePath: imagePath(seed.slug, variant),
      sourceImages: seed.sourceImages,
      promptString: buildPrompt(seed, variant),
      negativePrompt: NEGATIVE_PROMPT,
    })),
  )
