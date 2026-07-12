// /stores/helpers/modelBuilderRecipes.ts
//
// Static catalog for the Model Builder: the four gated stages, the supported
// source types, the recipe matrix, and the selectable output catalog. This is
// the front-end grounding for the conductor `model-builder` project brief —
// durable orchestration records live server-side in a later milestone; here we
// describe what a run may contain so the UI can drive it.

export type BuildStageKey =
  | 'PITCH'
  | 'FIELDS_AND_PROMPTS'
  | 'GENERATE_ASSETS'
  | 'COMMIT'

export interface BuildStageConfig {
  key: BuildStageKey
  label: string
  short: string
  description: string
  icon: string
}

// Ordered — an item advances through these and no later stage may bypass an
// unapproved prerequisite (enforced in the store).
export const BUILD_STAGES: BuildStageConfig[] = [
  {
    key: 'PITCH',
    label: 'Pitch',
    short: 'Pitch',
    description: 'Review the idea and intent for this output before any fields or assets exist.',
    icon: 'kind-icon:lightbulb',
  },
  {
    key: 'FIELDS_AND_PROMPTS',
    label: 'Fields & Prompts',
    short: 'Fields',
    description: 'Review proposed schema fields, relationships, and generation prompts.',
    icon: 'kind-icon:list',
  },
  {
    key: 'GENERATE_ASSETS',
    label: 'Generate Assets',
    short: 'Assets',
    description: 'Generate candidate images or media and pick the ones to keep.',
    icon: 'kind-icon:sparkles',
  },
  {
    key: 'COMMIT',
    label: 'Commit',
    short: 'Commit',
    description: 'Review the final diff and create, update, link, or promote only approved work.',
    icon: 'kind-icon:check',
  },
]

export type SourceTypeKey =
  | 'Project'
  | 'Character'
  | 'Bot'
  | 'Facet'
  | 'Dream'
  | 'Reward'
  | 'Scenario'

export interface SourceTypeConfig {
  key: SourceTypeKey
  label: string
  plural: string
  icon: string
  // List endpoint that returns { success, data: Record[] }.
  endpoint: string
  // Field used for the primary display name on each record.
  titleField: string
  // Optional secondary display field.
  subtitleField?: string
  defaultRecipe: RecipeKey
  recipes: RecipeKey[]
  blurb: string
}

export type RecipeKey =
  | 'marketing-deck'
  | 'character-deck'
  | 'reward-deck'
  | 'art-upgrade'
  | 'relationship-expansion'

export interface RecipeConfig {
  key: RecipeKey
  label: string
  icon: string
  summary: string
  sourceTypes: SourceTypeKey[]
}

export type BuildAction = 'CREATE' | 'UPDATE' | 'ASSET_ONLY'
export type GenerationKind = 'image' | 'text' | 'video' | 'three-d' | 'plan'

export interface BuildOutputConfig {
  key: string
  label: string
  recipe: RecipeKey
  action: BuildAction
  generation: GenerationKind
  description: string
  // Standard target dimensions for image outputs, when fixed.
  size?: string
  // Whether the user picks a quantity (batch / expansion outputs).
  quantity?: boolean
  // Suggested art engine hint for image outputs, passed to the art generator.
  engine?: 'a1111' | 'comfy' | 'flux' | 'kontext' | 'openai'
  // Selected by default when the recipe is chosen.
  defaultOn?: boolean
}

// ---------------------------------------------------------------------------
// Source type configuration — maps each supported model to its list endpoint,
// display fields, and eligible recipes (from the brief's recipe matrix).
// ---------------------------------------------------------------------------

export const SOURCE_TYPES: SourceTypeConfig[] = [
  {
    key: 'Project',
    label: 'Project',
    plural: 'Projects',
    icon: 'kind-icon:blueprint',
    endpoint: '/api/projects',
    titleField: 'title',
    subtitleField: 'description',
    defaultRecipe: 'marketing-deck',
    recipes: ['marketing-deck', 'art-upgrade', 'relationship-expansion'],
    blurb: 'Marketing decks, a manager bot, or an art upgrade for a project.',
  },
  {
    key: 'Character',
    label: 'Character',
    plural: 'Characters',
    icon: 'kind-icon:user',
    endpoint: '/api/characters',
    titleField: 'name',
    subtitleField: 'class',
    defaultRecipe: 'character-deck',
    recipes: ['character-deck', 'art-upgrade', 'relationship-expansion'],
    blurb: 'Full character deck, signature rewards, or an art upgrade.',
  },
  {
    key: 'Bot',
    label: 'Bot',
    plural: 'Bots',
    icon: 'kind-icon:robot',
    endpoint: '/api/bots',
    titleField: 'name',
    subtitleField: 'botType',
    defaultRecipe: 'character-deck',
    recipes: ['character-deck', 'art-upgrade'],
    blurb: 'Character deck with expressions, transitions, and an art upgrade.',
  },
  {
    key: 'Facet',
    label: 'Facet',
    plural: 'Facets',
    icon: 'kind-icon:gem',
    endpoint: '/api/facets',
    titleField: 'title',
    subtitleField: 'kind',
    defaultRecipe: 'art-upgrade',
    recipes: ['art-upgrade', 'relationship-expansion'],
    blurb: 'Art upgrade, or expand into fitting dreams, characters, or rewards.',
  },
  {
    key: 'Dream',
    label: 'Dream',
    plural: 'Dreams',
    icon: 'kind-icon:cloud',
    endpoint: '/api/dreams',
    titleField: 'title',
    subtitleField: 'dreamType',
    defaultRecipe: 'art-upgrade',
    recipes: ['art-upgrade', 'relationship-expansion'],
    blurb: 'Art upgrade, or expand into characters, rewards, scenarios, or a narrator bot.',
  },
  {
    key: 'Reward',
    label: 'Reward',
    plural: 'Rewards',
    icon: 'kind-icon:trophy',
    endpoint: '/api/rewards',
    titleField: 'name',
    subtitleField: 'rewardType',
    defaultRecipe: 'reward-deck',
    recipes: ['reward-deck', 'art-upgrade', 'relationship-expansion'],
    blurb: 'Reward deck with type-aware art and optional 3D reference.',
  },
  {
    key: 'Scenario',
    label: 'Scenario',
    plural: 'Scenarios',
    icon: 'kind-icon:map',
    endpoint: '/api/scenarios',
    titleField: 'title',
    subtitleField: 'difficulty',
    defaultRecipe: 'art-upgrade',
    recipes: ['art-upgrade', 'relationship-expansion'],
    blurb: 'Art upgrade, or expand into cast characters and rewards.',
  },
]

// ---------------------------------------------------------------------------
// Recipes — versioned presets of eligible outputs. Defaults are conveniences,
// never mandatory bundles: the user may remove all defaults and request one.
// ---------------------------------------------------------------------------

export const RECIPES: RecipeConfig[] = [
  {
    key: 'marketing-deck',
    label: 'Marketing Deck',
    icon: 'kind-icon:megaphone',
    summary: 'A launch package for a project — cards, signage, mockups, ads, and a plan.',
    sourceTypes: ['Project'],
  },
  {
    key: 'character-deck',
    label: 'Character Deck',
    icon: 'kind-icon:user',
    summary: 'Identity, canonical portrait, icon/card/hero, and an expression subset.',
    sourceTypes: ['Character', 'Bot'],
  },
  {
    key: 'reward-deck',
    label: 'Reward Deck',
    icon: 'kind-icon:trophy',
    summary: 'Reward fields, art, collection placement, and optional 3D reference.',
    sourceTypes: ['Reward'],
  },
  {
    key: 'art-upgrade',
    label: 'Art Upgrade',
    icon: 'kind-icon:palette-color',
    summary: 'Only the assets valid for this model: primary image, icon, card, hero, and repair.',
    sourceTypes: ['Project', 'Character', 'Bot', 'Facet', 'Dream', 'Reward', 'Scenario'],
  },
  {
    key: 'relationship-expansion',
    label: 'Relationship Expansion',
    icon: 'kind-icon:link',
    summary: 'Create related records — each child is an independently gated build item.',
    sourceTypes: ['Project', 'Character', 'Facet', 'Dream', 'Scenario', 'Reward'],
  },
]

// ---------------------------------------------------------------------------
// Output catalog — the selectable outputs per recipe. Each has a stable key,
// an action, a generation kind, and (for images) a target size.
// ---------------------------------------------------------------------------

export const OUTPUT_CATALOG: BuildOutputConfig[] = [
  // Marketing Deck (Project) --------------------------------------------------
  { key: 'business-card', label: 'Business card', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'image', description: 'Front/back business card concept.', defaultOn: true },
  { key: 'logo-application', label: 'Logo application sheet', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'image', description: 'Existing logo applied across surfaces.' },
  { key: 'lawn-sign', label: 'Lawn sign', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'image', description: 'Yard/lawn sign concept.' },
  { key: 'banner', label: 'Banner', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'image', size: '1280×720', description: 'Wide banner concept.' },
  { key: 'flyer', label: 'Flyer', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'image', description: 'Single-page promotional flyer.' },
  { key: 'website-mockup', label: 'Website mockup board', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'image', description: 'Landing page mockup board.', defaultOn: true },
  { key: 'app-mockup', label: 'App mockup board', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'image', description: 'App screen mockup board.' },
  { key: 'photo-shoot-plan', label: 'Photo-shoot plan', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'plan', description: 'Shot list and plan for a photo shoot.' },
  { key: 'video-shot-list', label: 'Video shot list', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'plan', description: 'Shot list for a video shoot.' },
  { key: 'static-ads', label: 'Static ad concepts', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'image', description: 'Static ad posters and concepts.' },
  { key: 'commercial-treatment', label: 'Video commercial treatment', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'plan', description: 'Treatment for a video commercial.' },
  { key: 'storyboard', label: 'Storyboard', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'image', description: 'Panel storyboard for the commercial.' },
  { key: 'launch-plan', label: 'Week-by-week launch plan', recipe: 'marketing-deck', action: 'ASSET_ONLY', generation: 'plan', description: 'Weekly launch schedule.', defaultOn: true },

  // Character Deck (Character / Bot) -----------------------------------------
  { key: 'identity-pitch', label: 'Identity pitch', recipe: 'character-deck', action: 'UPDATE', generation: 'text', description: 'Identity and field pitch for the character.', defaultOn: true },
  { key: 'field-proposal', label: 'Schema field proposal', recipe: 'character-deck', action: 'UPDATE', generation: 'text', description: 'Proposed schema fields to fill or refine.', defaultOn: true },
  { key: 'canonical-avatar', label: 'Canonical avatar (NEUTRAL)', recipe: 'character-deck', action: 'ASSET_ONLY', generation: 'image', size: 'square', description: 'Promoted neutral avatar — canonical identity anchor.', defaultOn: true },
  { key: 'portrait-candidates', label: 'Portrait candidates', recipe: 'character-deck', action: 'ASSET_ONLY', generation: 'image', size: 'square', description: 'Candidate portraits to pick a canonical from.' },
  { key: 'icon', label: 'Icon', recipe: 'character-deck', action: 'ASSET_ONLY', generation: 'image', size: '256×256', description: 'Square icon.' },
  { key: 'card', label: 'Card', recipe: 'character-deck', action: 'ASSET_ONLY', generation: 'image', size: '512×768', description: 'Portrait card.' },
  { key: 'hero', label: 'Hero shot', recipe: 'character-deck', action: 'ASSET_ONLY', generation: 'image', size: '1280×720', description: 'Wide hero action shot.' },
  { key: 'expression-subset', label: 'Expression subset', recipe: 'character-deck', action: 'ASSET_ONLY', generation: 'image', size: 'square', quantity: true, description: 'A small ExpressionMedia emotion/action subset — proven on a subset before the full set.' },
  { key: 'model-sheet', label: 'Cutout / model-sheet reference', recipe: 'character-deck', action: 'ASSET_ONLY', generation: 'image', description: 'Transparent cutout or model-sheet reference.' },
  { key: 'three-d-reference', label: '3D reference / model', recipe: 'character-deck', action: 'ASSET_ONLY', generation: 'three-d', description: 'Optional 3D reference output (Hunyuan3D).' },

  // Reward Deck (Reward) ------------------------------------------------------
  { key: 'reward-fields', label: 'Reward fields', recipe: 'reward-deck', action: 'UPDATE', generation: 'text', description: 'Reward field proposal.', defaultOn: true },
  { key: 'reward-icon', label: 'Icon', recipe: 'reward-deck', action: 'ASSET_ONLY', generation: 'image', size: '256×256', description: 'Reward icon.', defaultOn: true },
  { key: 'reward-card', label: 'Card', recipe: 'reward-deck', action: 'ASSET_ONLY', generation: 'image', size: '512×768', description: 'Reward card.' },
  { key: 'reward-hero', label: 'Hero / use scene', recipe: 'reward-deck', action: 'ASSET_ONLY', generation: 'image', size: '1280×720', description: 'Hero or in-use scene.' },
  { key: 'collection-placement', label: 'Collection placement', recipe: 'reward-deck', action: 'UPDATE', generation: 'text', description: 'Suggested ArtCollection placement.' },
  { key: 'reward-relationships', label: 'Relationship proposals', recipe: 'reward-deck', action: 'UPDATE', generation: 'text', description: 'Owner-character or scenario-use pitches.' },
  { key: 'reward-3d', label: '3D reference / print path', recipe: 'reward-deck', action: 'ASSET_ONLY', generation: 'three-d', description: 'ITEM: 3D reference and printable-model path (separate STL stages).' },

  // Art Upgrade (any) ---------------------------------------------------------
  { key: 'primary-image', label: 'Primary image', recipe: 'art-upgrade', action: 'ASSET_ONLY', generation: 'image', description: 'Primary image for the model.', defaultOn: true },
  { key: 'upgrade-icon', label: 'Icon', recipe: 'art-upgrade', action: 'ASSET_ONLY', generation: 'image', size: '256×256', description: 'Square icon.' },
  { key: 'upgrade-card', label: 'Card', recipe: 'art-upgrade', action: 'ASSET_ONLY', generation: 'image', size: '512×768', description: 'Portrait card.' },
  { key: 'upgrade-hero', label: 'Hero', recipe: 'art-upgrade', action: 'ASSET_ONLY', generation: 'image', size: '1280×720', description: 'Wide hero banner.' },
  { key: 'key-scene', label: 'Key scene', recipe: 'art-upgrade', action: 'ASSET_ONLY', generation: 'image', description: 'A signature scene image.' },
  { key: 'inspiration-set', label: 'Inspiration set / ArtCollection', recipe: 'art-upgrade', action: 'ASSET_ONLY', generation: 'image', quantity: true, description: 'A set of inspiration candidates for the collection.' },
  { key: 'missing-asset-repair', label: 'Missing-asset repair', recipe: 'art-upgrade', action: 'ASSET_ONLY', generation: 'image', description: 'Fill only the assets this model is missing.' },

  // Relationship Expansion ----------------------------------------------------
  { key: 'expand-characters', label: 'Characters', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', quantity: true, description: 'Create X fitting characters, each an independent build item.' },
  { key: 'expand-rewards', label: 'Rewards', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', quantity: true, description: 'Create X fitting rewards.' },
  { key: 'expand-scenarios', label: 'Scenarios', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', quantity: true, description: 'Create X fitting scenarios.' },
  { key: 'expand-narrator-bot', label: 'Narrator bot', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', description: 'Optional narrator bot for a dream.' },
  { key: 'expand-manager-bot', label: 'Manager bot', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', description: 'Optional manager bot for a project.' },
  { key: 'expand-signature-rewards', label: 'Signature rewards', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', quantity: true, description: 'Signature rewards for a character.' },
]

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getSourceType(key: SourceTypeKey): SourceTypeConfig | undefined {
  return SOURCE_TYPES.find((source) => source.key === key)
}

export function getRecipe(key: RecipeKey): RecipeConfig | undefined {
  return RECIPES.find((recipe) => recipe.key === key)
}

export function getRecipesForSource(sourceKey: SourceTypeKey): RecipeConfig[] {
  const source = getSourceType(sourceKey)
  if (!source) return []
  return source.recipes
    .map((recipeKey) => getRecipe(recipeKey))
    .filter((recipe): recipe is RecipeConfig => Boolean(recipe))
}

export function getOutputsForRecipe(recipeKey: RecipeKey): BuildOutputConfig[] {
  return OUTPUT_CATALOG.filter((output) => output.recipe === recipeKey)
}

export function getOutput(key: string): BuildOutputConfig | undefined {
  return OUTPUT_CATALOG.find((output) => output.key === key)
}

export function getStage(key: BuildStageKey): BuildStageConfig | undefined {
  return BUILD_STAGES.find((stage) => stage.key === key)
}
