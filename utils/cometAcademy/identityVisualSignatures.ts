import { identityFor } from './identityArcs'
import type { SignaturePowerId } from './specialPowers'

export type IdentityVisualSignature = {
  silhouette: string
  anatomy: string
  signatureProp: string
  movement: string
  transformation: string
  portraitDirection: string
}

/**
 * Canonical physical identity stays unchanged across rookie, hero and heel
 * splashes. The scenes and decisions change, never the person or codename.
 * These authored directions are production inputs, not claims of delivered art.
 */
export const IDENTITY_VISUAL_SIGNATURES = {
  'accident-fire': {
    silhouette: 'Broad shoulders and a permanently shimmering heat halo',
    anatomy: 'Dark skin, heat-cracked fingertips and ember-lit hairline',
    signatureProp: 'Oversized kitchen mitts clipped to a scorched apron belt',
    movement: 'Plants his feet before each deliberate, heat-shielded rescue',
    transformation:
      'Heat bends the air around his hands without changing his face',
    portraitDirection:
      'Dez holds an unburnt paper lunch bag in both padded hands',
  },
  'accident-genius': {
    silhouette: 'Towering beehive hair above a narrow laboratory coat',
    anatomy: 'Freckled face and perpetually raised, questioning eyebrows',
    signatureProp: 'A pocket carousel of impossible prototype tools',
    movement: 'Stops mid-stride to scribble calculations on any surface',
    transformation: 'Her inventions unfold around her, not over her face',
    portraitDirection:
      'Otto balances three sparking prototypes while taking notes',
  },
  'mutant-fire': {
    silhouette: 'Compact fighter with an uneven corona of living cinders',
    anatomy: 'Ash-patterned skin with bright seams along the forearms',
    signatureProp: 'A dented metal thermos used to cool her palms',
    movement: 'Darts sideways before flaring into a defensive stance',
    transformation:
      'Cinders rise from her skin while her recognizable face remains',
    portraitDirection: 'Ruby shields a small seedling from her own heat',
  },
  'mutant-genius': {
    silhouette: 'Long-limbed figure with a web of branching luminous veins',
    anatomy: 'Distinctive angular face and extra-sensitive fingertips',
    signatureProp: 'A battered notebook full of contingency diagrams',
    movement: 'Anticipates danger and moves a heartbeat before it arrives',
    transformation: 'Vein patterns brighten as predictions multiply',
    portraitDirection:
      'Theo watches several domino chains with visible concern',
  },
  'tech-fire': {
    silhouette: 'Angular armored shoulders with twin compact furnace vents',
    anatomy: 'Visible human face framed by heat-resistant mechanical fittings',
    signatureProp: 'Welding visor and a scorched engineer tool roll',
    movement: 'Heavy boot pivots followed by precise short jet bursts',
    transformation: 'Suit panels open into radiant heat baffles',
    portraitDirection: 'Vee welds a broken school gate with her visor lifted',
  },
  'tech-genius': {
    silhouette: 'Short, broad amphibian scientist with enormous webbed hands',
    anatomy: 'Genuine frog muzzle, bulging eyes, mottled skin and throat sac',
    signatureProp: 'A glass reagent bandolier and tiny waterproof spectacles',
    movement:
      'Explosive crouched leaps followed by exacting laboratory gestures',
    transformation: 'Throat sac inflates as chemical reactions change color',
    portraitDirection: 'Dr. Frog examines a bubbling flask with one eye',
  },
  'magic-fire': {
    silhouette: 'Tall layered robes with a hovering ring of lantern flames',
    anatomy: 'Recognizable face and ink-stained fingers beneath the sleeves',
    signatureProp:
      'A crooked hand lantern with several separate flame chambers',
    movement: 'Slow circular gestures that pull flames into protective paths',
    transformation:
      'Runes illuminate the robe hems without replacing the wearer',
    portraitDirection: 'Hollis lights a dark stairwell with a lantern held low',
  },
  'magic-genius': {
    silhouette: 'Narrow magician with orbiting geometric chalk diagrams',
    anatomy: 'Sharp nose and a permanent chalk streak across one cheek',
    signatureProp: 'A folding brass ruler etched with impossible theorems',
    movement: 'Steps between equations drawn in midair',
    transformation: 'Geometric proofs unfold around his hands',
    portraitDirection: 'Lucan argues with a hovering diagram in a classroom',
  },
  'alien-fire': {
    silhouette: 'Radiant nonhuman figure with elongated sunray-like crown',
    anatomy: 'Translucent luminous skin and unfamiliar joint proportions',
    signatureProp: 'A small insulated case containing a fragment of home',
    movement: 'Floats in short arcs with light trailing from the limbs',
    transformation:
      'Solar markings brighten while facial features remain stable',
    portraitDirection: 'Ixi cups a tiny artificial sun above an open palm',
  },
  'alien-genius': {
    silhouette: 'Tall asymmetric alien with multiple articulated sensory fins',
    anatomy: 'Distinctive alien eyes and patterned nonhuman skin',
    signatureProp:
      'A floating translation instrument built from salvaged parts',
    movement: 'Sensory fins turn toward problems before the body does',
    transformation: 'Fins spread into a geometric antenna array',
    portraitDirection: 'Oorin repairs a translator beside a curious student',
  },
  'psychic-fire': {
    silhouette: 'Wiry figure surrounded by hovering ember-shaped memories',
    anatomy: 'Human face with a distinctive pale streak through the hair',
    signatureProp: 'A fireproof keepsake box filled with handwritten names',
    movement: 'Reaches toward danger before a memory-flame appears',
    transformation: 'Projected flames form images without burning the body',
    portraitDirection: 'Cassidy holds a glowing remembered photograph',
  },
  'psychic-genius': {
    silhouette:
      'Still upright posture with a halo of suspended thought fragments',
    anatomy: 'Expressive eyes and an unmistakable asymmetric haircut',
    signatureProp: 'A deck of handwritten question cards',
    movement: 'Barely moves while surrounding objects reveal hidden patterns',
    transformation: 'Thought fragments arrange into branching visible diagrams',
    portraitDirection: 'Ezra studies a levitating puzzle with hands folded',
  },
  'accident-air': {
    silhouette:
      'Compact athletic pilot in a cropped flight jacket with a loose parachute harness',
    anatomy:
      'Wind-tossed short hair, lightning-scarred calves and a recognizable dimpled grin',
    signatureProp:
      'Two bright orange parachute steering toggles on a battered chest strap',
    movement:
      'Pip leaps into open air and arrests the fall with both boots inches above the floor',
    transformation:
      'Small spiral streams of clear air curl around her limbs without concealing her face',
    portraitDirection:
      'Pip catches a dropped helmet while hovering beside an airfield windsock',
  },
  'accident-water': {
    silhouette:
      'Tall swimmer with a long waterproof jacket and looping coils of water around her wrists',
    anatomy:
      'Wet dark hair, subtle cooling-pond markings along the collarbone and strong swimmer shoulders',
    signatureProp:
      'A dented metal cooling-pond sample canister clipped to a diving belt',
    movement:
      'Marisol plants her feet and draws a rolling wave upward through the pavement',
    transformation:
      'Water rises in transparent ribbons across her sleeves while her features remain unchanged',
    portraitDirection:
      'Marisol lifts water from a cracked city hydrant into a clear suspended arch',
  },
  'mutant-air': {
    silhouette:
      'Willowy young man in a long split coat with feathered forearms spreading like narrow wings',
    anatomy:
      'Fine dark feathers along both arms, light hollow-boned posture and pointed shoulder blades',
    signatureProp:
      'An oversized coat with reinforced slits concealing the feathered arms',
    movement:
      'Corvin launches sideways in one quick stroke and lands almost without sound',
    transformation:
      'Individual forearm feathers fan outward while the same face and body remain visible',
    portraitDirection:
      'Corvin folds his feathered arms around a frightened rooftop pigeon in the wind',
  },
  'mutant-water': {
    silhouette:
      'Broad-shouldered dockworker with a wet canvas coat and a narrow breathing collar',
    anatomy:
      'Visible gill slits behind both ears, webbed hands and salt-crusted hair at the temples',
    signatureProp:
      'A small portable saltwater mister clipped beside a fishing-boat key ring',
    movement:
      'Ilya slips low across slick stone and surfaces from water in one fluid movement',
    transformation:
      'Gills open visibly and thin sheets of seawater travel across his forearms',
    portraitDirection:
      'Ilya rests one webbed hand on a harbor bollard while checking the waterline',
  },
  'tech-air': {
    silhouette:
      'Lean drone racer in a compact micro-turbine wingsuit with two angled fabric fins',
    anatomy:
      'Human face behind an open flight visor, cropped hair and scarred mechanic knuckles',
    signatureProp:
      'Paired turbine control grips and an orange battery pack mounted on the suit waist',
    movement:
      'Jun-ho leans into a precise short thruster burst with both wings held level',
    transformation:
      'Mechanical fins unfold and turbine vanes spin without changing his human anatomy',
    portraitDirection:
      'Jun-ho repairs a palm-sized racing drone while his wingsuit rests half unfolded',
  },
  'tech-water': {
    silhouette:
      'Sturdy marine rescue diver with a streamlined blue diving rig and a clear pressure helmet',
    anatomy:
      'Visible human face through the glass, strong shoulders and weathered hands',
    signatureProp:
      'Brass rescue light and two flexible pressure hoses mounted to the diving harness',
    movement:
      'Nalani takes deliberate heavy steps then glides when the water jets engage',
    transformation:
      'Rescue thrusters unfold from the suit and release narrow controlled water streams',
    portraitDirection:
      'Nalani kneels by a pier ladder holding a rescue float beneath the suit lamp',
  },
  'magic-air': {
    silhouette:
      'Long-limbed singer in layered choir robes with a thin ring of storm cloud overhead',
    anatomy:
      'Angular human face, wind-loosened curls and ink-dark markings on both palms',
    signatureProp:
      'A tarnished silver tuning fork tucked into a weathered hymn book',
    movement:
      'Ambrose raises the tuning fork and turns in measured circles as air currents gather',
    transformation:
      'Cloud wisps spiral around his sleeves while the same facial features stay clear',
    portraitDirection:
      'Ambrose sings beside an open library window with rain curling upward outside',
  },
  'magic-water': {
    silhouette:
      'Slender street magician in a fitted waistcoat with a shallow silver basin at one hip',
    anatomy:
      'Recognizable narrow face, steady eyes and water-darkened fingertips',
    signatureProp:
      'A hand-hammered silver scrying bowl with a chipped rim and folding stand',
    movement:
      'Caspian steps around reflections on the ground without breaking their surface',
    transformation:
      'Liquid mirror reflections rise beside him without masking his body',
    portraitDirection:
      'Caspian holds the silver bowl at chest height as two clear reflections gather',
  },
  'alien-air': {
    silhouette:
      'Tall translucent vapor-bodied ambassador contained within an open atmospheric harness',
    anatomy:
      'Distinctive cloud-like facial arrangement and several long floating vapor tendrils',
    signatureProp:
      'A portable pressure-field collar with three amber atmospheric gauges',
    movement:
      'Quillon drifts above the floor while the vapor tendrils turn toward each speaker',
    transformation:
      'The cloud body spreads into a broad arc before condensing to the same outline',
    portraitDirection:
      'Quillon offers a small floating sphere of mist to a grounded city diplomat',
  },
  'alien-water': {
    silhouette:
      'Graceful ocean-world visitor with luminous fin fringes and a flowing translucent mantle',
    anatomy:
      'Nonhuman sea-bright eyes, delicate fin ridges and pearlescent patterned skin',
    signatureProp:
      'A spiral shell bracelet and sealed sea-glass vessel of water from home',
    movement:
      'Thessaly glides forward with slow undulating fin motions and a trailing water ribbon',
    transformation:
      'Bioluminescent fin edges brighten as nearby sea creatures gather around her',
    portraitDirection:
      'Thessaly kneels at the pier holding a tiny crab in cupped shimmering hands',
  },
  'psychic-air': {
    silhouette:
      'Androgynous levitating student in loose street clothes with hair hanging weightlessly',
    anatomy:
      'Recognizable soft facial features, floating hair strands and scuffed hands',
    signatureProp:
      'An old climbing cord looped neatly around a pair of worn high-top shoes',
    movement:
      'Avery rises vertically in careful small increments with shoes never touching the stair',
    transformation:
      'Loose clothing and nearby dust lift into a gentle gravityless halo',
    portraitDirection:
      'Avery hovers beside an apartment staircase holding groceries steady in midair',
  },
  'psychic-water': {
    silhouette:
      'Quiet lighthouse keeper in a wool coat with faint tide circles circling his shoulders',
    anatomy:
      'Soft expressive eyes, wind-chapped cheeks and distinctive wavy dark hair',
    signatureProp:
      'A small lighthouse pendant dangling beside a folded tide-chart notebook',
    movement:
      'Lior holds perfectly still while ripples expand across any nearby water',
    transformation:
      'Transparent rings of seawater echo his gestures without covering his face',
    portraitDirection:
      'Lior stands by a lighthouse window calming a stormy bowl of water with one hand',
  },
} satisfies Partial<Record<SignaturePowerId, IdentityVisualSignature>>

export function visualSignatureFor(signature: SignaturePowerId) {
  identityFor(signature)
  return (
    IDENTITY_VISUAL_SIGNATURES[
      signature as keyof typeof IDENTITY_VISUAL_SIGNATURES
    ] ?? null
  )
}
