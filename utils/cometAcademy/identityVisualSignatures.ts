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
    transformation: 'Heat bends the air around his hands without changing his face',
    portraitDirection: 'Dez holds an unburnt paper lunch bag in both padded hands',
  },
  'accident-genius': {
    silhouette: 'Towering beehive hair above a narrow laboratory coat',
    anatomy: 'Freckled face and perpetually raised, questioning eyebrows',
    signatureProp: 'A pocket carousel of impossible prototype tools',
    movement: 'Stops mid-stride to scribble calculations on any surface',
    transformation: 'Her inventions unfold around her, not over her face',
    portraitDirection: 'Otto balances three sparking prototypes while taking notes',
  },
  'mutant-fire': {
    silhouette: 'Compact fighter with an uneven corona of living cinders',
    anatomy: 'Ash-patterned skin with bright seams along the forearms',
    signatureProp: 'A dented metal thermos used to cool her palms',
    movement: 'Darts sideways before flaring into a defensive stance',
    transformation: 'Cinders rise from her skin while her recognizable face remains',
    portraitDirection: 'Ruby shields a small seedling from her own heat',
  },
  'mutant-genius': {
    silhouette: 'Long-limbed figure with a web of branching luminous veins',
    anatomy: 'Distinctive angular face and extra-sensitive fingertips',
    signatureProp: 'A battered notebook full of contingency diagrams',
    movement: 'Anticipates danger and moves a heartbeat before it arrives',
    transformation: 'Vein patterns brighten as predictions multiply',
    portraitDirection: 'Theo watches several domino chains with visible concern',
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
    movement: 'Explosive crouched leaps followed by exacting laboratory gestures',
    transformation: 'Throat sac inflates as chemical reactions change color',
    portraitDirection: 'Dr. Frog examines a bubbling flask with one eye',
  },
  'magic-fire': {
    silhouette: 'Tall layered robes with a hovering ring of lantern flames',
    anatomy: 'Recognizable face and ink-stained fingers beneath the sleeves',
    signatureProp: 'A crooked hand lantern with several separate flame chambers',
    movement: 'Slow circular gestures that pull flames into protective paths',
    transformation: 'Runes illuminate the robe hems without replacing the wearer',
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
    transformation: 'Solar markings brighten while facial features remain stable',
    portraitDirection: 'Ixi cups a tiny artificial sun above an open palm',
  },
  'alien-genius': {
    silhouette: 'Tall asymmetric alien with multiple articulated sensory fins',
    anatomy: 'Distinctive alien eyes and patterned nonhuman skin',
    signatureProp: 'A floating translation instrument built from salvaged parts',
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
    silhouette: 'Still upright posture with a halo of suspended thought fragments',
    anatomy: 'Expressive eyes and an unmistakable asymmetric haircut',
    signatureProp: 'A deck of handwritten question cards',
    movement: 'Barely moves while surrounding objects reveal hidden patterns',
    transformation: 'Thought fragments arrange into branching visible diagrams',
    portraitDirection: 'Ezra studies a levitating puzzle with hands folded',
  },
} satisfies Partial<Record<SignaturePowerId, IdentityVisualSignature>>

export function visualSignatureFor(signature: SignaturePowerId) {
  identityFor(signature)
  return IDENTITY_VISUAL_SIGNATURES[
    signature as keyof typeof IDENTITY_VISUAL_SIGNATURES
  ] ?? null
}
