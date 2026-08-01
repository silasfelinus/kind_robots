// /utils/seeds/facetCatalogCuration.ts
import type {
  FacetRelationType,
  FacetTaxonomy,
} from './../../prisma/generated/prisma/client'

export type CuratedFacetDefinition = {
  slug: string
  title: string
  taxonomy: FacetTaxonomy
  canonicalValue?: string
  groupKey: string
  groupLabel: string
  isRandomizable: boolean
  randomWeight: number
  aliases?: readonly string[]
  description?: string
}

export type CuratedFacetRelation = {
  toSlug: string
  relationType: FacetRelationType
  note: string
}

export type FacetTransformDefinition = {
  lookup: readonly string[]
  taxonomy: FacetTaxonomy
  canonicalValue?: string
  groupKey: string
  groupLabel: string
  isRandomizable: boolean
  randomWeight: number
  aliases?: readonly string[]
  relations?: readonly CuratedFacetRelation[]
}

export type FacetWeightDefinition = {
  lookup: readonly string[]
  randomWeight: number
}

export type FacetCurationBatch = {
  id: string
  title: string
  ensures: readonly CuratedFacetDefinition[]
  transforms: readonly FacetTransformDefinition[]
  weights: readonly FacetWeightDefinition[]
}

const genre = (
  slug: string,
  title: string,
  aliases: readonly string[] = [],
): CuratedFacetDefinition => ({
  slug,
  title,
  taxonomy: 'GENRE',
  canonicalValue: title,
  groupKey: 'curated-genre',
  groupLabel: 'Curated Genres',
  isRandomizable: true,
  randomWeight: 1.5,
  aliases,
})

const theme = (
  slug: string,
  title: string,
  aliases: readonly string[] = [],
): CuratedFacetDefinition => ({
  slug,
  title,
  taxonomy: 'THEME',
  canonicalValue: title,
  groupKey: 'curated-theme',
  groupLabel: 'Curated Themes',
  isRandomizable: true,
  randomWeight: 1,
  aliases,
})

const mood = (
  slug: string,
  title: string,
  aliases: readonly string[] = [],
): CuratedFacetDefinition => ({
  slug,
  title,
  taxonomy: 'MOOD',
  canonicalValue: title,
  groupKey: 'curated-mood',
  groupLabel: 'Curated Moods',
  isRandomizable: true,
  randomWeight: 1,
  aliases,
})

const setting = (
  slug: string,
  title: string,
  aliases: readonly string[] = [],
): CuratedFacetDefinition => ({
  slug,
  title,
  taxonomy: 'SETTING',
  canonicalValue: title,
  groupKey: 'curated-setting',
  groupLabel: 'Curated Settings',
  isRandomizable: true,
  randomWeight: 1,
  aliases,
})

const contains = (toSlug: string, note: string): CuratedFacetRelation => ({
  toSlug,
  relationType: 'CONTAINS',
  note,
})

const related = (toSlug: string, note: string): CuratedFacetRelation => ({
  toSlug,
  relationType: 'RELATED',
  note,
})

const recipe = (
  lookup: readonly string[],
  relations: readonly CuratedFacetRelation[],
): FacetTransformDefinition => ({
  lookup,
  taxonomy: 'THEME',
  groupKey: 'genre-recipe',
  groupLabel: 'Genre Recipes',
  isRandomizable: false,
  randomWeight: 0,
  relations,
})

const settingTransform = (
  lookup: readonly string[],
  randomWeight = 1,
  relations: readonly CuratedFacetRelation[] = [],
): FacetTransformDefinition => ({
  lookup,
  taxonomy: 'SETTING',
  groupKey: 'curated-setting',
  groupLabel: 'Curated Settings',
  isRandomizable: true,
  randomWeight,
  relations,
})

export const FACET_CURATION_BATCHES = [
  {
    id: '2026-08-01-genre-structure-01',
    title: 'Decompose composite genres and recover setting-shaped entries',
    ensures: [
      genre('isekai', 'Isekai'),
      theme('reluctant-protagonist', 'Reluctant Protagonist'),
      genre('slice-of-life', 'Slice of Life'),
      theme('complicated-relationships', 'Complicated Relationships'),
      genre('shonen', 'Shonen'),
      theme('aging-protagonist', 'Aging Protagonist'),
      genre('magical-girl', 'Magical Girl'),
      theme('retired-hero', 'Retired Hero'),
      genre('hard-science-fiction', 'Hard Science Fiction', ['Hard Sci-Fi']),
      mood('emotionally-intimate', 'Emotionally Intimate', ['Soft Feelings']),
      genre('body-horror', 'Body Horror'),
      mood('tender', 'Tender'),
      genre('kaiju', 'Kaiju'),
      theme('monster-perspective', 'Monster Perspective', [
        "From the Kaiju's Perspective",
      ]),
      genre('noir', 'Noir'),
      theme('reality-slightly-wrong', 'Reality Slightly Wrong', [
        'One Detail Wrong',
      ]),
      setting('carnival', 'Carnival'),
      theme('abandoned', 'Abandoned'),
      theme('still-operating', 'Still Operating', ['Still Running']),
      genre('western', 'Western'),
      theme('unusual-perspective', 'Unusual Perspective', ['Strange Angle']),
      genre('political-thriller', 'Political Thriller'),
      genre('fairy-tale', 'Fairy Tale', ['Fairytale']),
      genre('post-apocalyptic', 'Post-Apocalyptic', ['Post Apocalyptic']),
      genre('folklore', 'Folklore'),
      genre('pastoral', 'Pastoral'),
    ],
    transforms: [
      settingTransform(['The Big Blue', 'the-big-blue'], 1.5),
      settingTransform(['Infinite Archive', 'infinite-archive']),
      settingTransform(['Underwater Cathedral', 'underwater-cathedral']),
      settingTransform([
        'Bioluminescent Underground',
        'bioluminescent-underground',
      ]),
      settingTransform(['Underground Society', 'underground-society']),
      settingTransform(['Carnival', 'carnival']),
      settingTransform(
        ['Empty Parliament Thriller', 'empty-parliament-thriller'],
        0.75,
        [
          related(
            'political-thriller',
            'The setting originated as a political-thriller hybrid.',
          ),
        ],
      ),
      settingTransform(
        ['Too-Close Moon Fairytale', 'too-close-moon-fairytale'],
        0.75,
        [
          related(
            'fairy-tale',
            'The setting originated as a fairy-tale hybrid.',
          ),
        ],
      ),
      settingTransform(
        ['Green Sky Apocalypse', 'green-sky-apocalypse'],
        0.75,
        [
          related(
            'post-apocalyptic',
            'The setting originated as a post-apocalyptic hybrid.',
          ),
        ],
      ),
      settingTransform(
        ['Old Forest Folklore', 'old-forest-folklore'],
        0.75,
        [
          related(
            'folklore',
            'The setting originated as a folklore hybrid.',
          ),
        ],
      ),
      settingTransform(
        ['Village Creature Pastoral', 'village-creature-pastoral'],
        0.75,
        [
          related(
            'pastoral',
            'The setting originated as a pastoral hybrid.',
          ),
        ],
      ),
      recipe(
        ['Isekai (reluctant)', 'isekai-reluctant'],
        [
          contains('isekai', 'Reusable base genre.'),
          contains('reluctant-protagonist', 'Reusable protagonist theme.'),
        ],
      ),
      recipe(
        ['Slice of Life (complicated)', 'slice-of-life-complicated'],
        [
          contains('slice-of-life', 'Reusable base genre.'),
          contains(
            'complicated-relationships',
            'Reusable relationship theme.',
          ),
        ],
      ),
      recipe(
        ['Shonen (aging protagonist)', 'shonen-aging-protagonist'],
        [
          contains('shonen', 'Reusable base genre.'),
          contains('aging-protagonist', 'Reusable protagonist theme.'),
        ],
      ),
      recipe(
        ['Magical Girl (retired)', 'magical-girl-retired'],
        [
          contains('magical-girl', 'Reusable base genre.'),
          contains('retired-hero', 'Reusable character-history theme.'),
        ],
      ),
      recipe(
        ['Hard Sci-Fi (soft feelings)', 'hard-sci-fi-soft-feelings'],
        [
          contains('hard-science-fiction', 'Reusable base genre.'),
          contains('emotionally-intimate', 'Reusable emotional register.'),
        ],
      ),
      recipe(
        ['Body Horror (tender)', 'body-horror-tender'],
        [
          contains('body-horror', 'Reusable base genre.'),
          contains('tender', 'Reusable emotional register.'),
        ],
      ),
      recipe(
        [
          "Kaiju (from the kaiju's perspective)",
          'kaiju-from-the-kaiju-s-perspective',
        ],
        [
          contains('kaiju', 'Reusable base genre.'),
          contains('monster-perspective', 'Reusable point-of-view theme.'),
        ],
      ),
      recipe(
        ['Noir (one detail wrong)', 'noir-one-detail-wrong'],
        [
          contains('noir', 'Reusable base genre.'),
          contains('reality-slightly-wrong', 'Reusable reality-shift theme.'),
        ],
      ),
      recipe(
        [
          'Carnival (abandoned, still running)',
          'carnival-abandoned-still-running',
        ],
        [
          contains('carnival', 'Reusable setting.'),
          contains('abandoned', 'Reusable condition theme.'),
          contains('still-operating', 'Reusable uncanny-state theme.'),
        ],
      ),
      recipe(
        ['Western (strange angle)', 'western-strange-angle'],
        [
          contains('western', 'Reusable base genre.'),
          contains('unusual-perspective', 'Reusable point-of-view theme.'),
        ],
      ),
    ],
    weights: [
      {
        lookup: ['Fantasy', 'fantasy'],
        randomWeight: 3,
      },
      {
        lookup: ['Science Fiction', 'Sci-Fi', 'science-fiction', 'sci-fi'],
        randomWeight: 3,
      },
      {
        lookup: ['Horror', 'horror'],
        randomWeight: 3,
      },
      {
        lookup: ['Comedy', 'comedy'],
        randomWeight: 3,
      },
      {
        lookup: ['Mystery', 'mystery'],
        randomWeight: 3,
      },
      {
        lookup: ['Romance', 'romance'],
        randomWeight: 3,
      },
      {
        lookup: ['Thriller', 'thriller'],
        randomWeight: 3,
      },
      {
        lookup: ['Western', 'western'],
        randomWeight: 3,
      },
      {
        lookup: ['Fairy Tale', 'fairy-tale'],
        randomWeight: 3,
      },
      {
        lookup: ['Cyberpunk', 'cyberpunk'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Steampunk', 'steampunk'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Space Opera', 'space-opera'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Urban Fantasy', 'urban-fantasy'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Superhero', 'superhero'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Gothic Horror', 'gothic-horror'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Cosmic Horror', 'cosmic-horror'],
        randomWeight: 1.5,
      },
      {
        lookup: ['High Fantasy', 'high-fantasy'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Low Fantasy', 'low-fantasy'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Sword and Sorcery', 'sword-and-sorcery'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Solarpunk', 'solarpunk'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Noir', 'noir'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Isekai', 'isekai'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Slice of Life', 'slice-of-life'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Shonen', 'shonen'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Magical Girl', 'magical-girl'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Body Horror', 'body-horror'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Folk Horror', 'folk-horror'],
        randomWeight: 1.5,
      },
      {
        lookup: ['First Contact', 'first-contact'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Hard Science Fiction', 'Hard Sci-Fi', 'hard-science-fiction'],
        randomWeight: 1.5,
      },
      {
        lookup: ['Bureaucratic Fantasy', 'bureaucratic-fantasy'],
        randomWeight: 0.5,
      },
      {
        lookup: ['Academic Eldritch', 'academic-eldritch'],
        randomWeight: 0.5,
      },
      {
        lookup: ['Municipal Necromancy', 'municipal-necromancy'],
        randomWeight: 0.5,
      },
      {
        lookup: ['Wilderness Bureaucracy', 'wilderness-bureaucracy'],
        randomWeight: 0.5,
      },
      {
        lookup: ['Archive Horror', 'archive-horror'],
        randomWeight: 0.5,
      },
      {
        lookup: ['Culinary Horror', 'culinary-horror'],
        randomWeight: 0.5,
      },
      {
        lookup: ['Geological Romance', 'geological-romance'],
        randomWeight: 0.5,
      },
      {
        lookup: ['Alien Bureaucracy', 'alien-bureaucracy'],
        randomWeight: 0.5,
      },
      {
        lookup: [
          'Lovecraftian Office Comedy',
          'lovecraftian-office-comedy',
        ],
        randomWeight: 0.5,
      },
      {
        lookup: ['Cartoon Noir', 'cartoon-noir'],
        randomWeight: 0.5,
      },
      {
        lookup: ['Horror Comedy', 'horror-comedy'],
        randomWeight: 0.5,
      },
    ],
  },
] as const satisfies readonly FacetCurationBatch[]
