# Facet source audit

## Decision

Facet becomes the canonical library for reusable creative building blocks. `randomStore` remains the selection and combination engine, but it should stop owning parallel genre, species, animal, class, personality, backstory, quirk, theme, style, and color encyclopedias.

This audit is intentionally non-destructive. It inventories sources and defines migration rules before changing `FacetKind`, adding join tables, or seeding database rows.

Run the executable inventory with:

```bash
npm run audit:facet-sources
```

Run the parser self-test with:

```bash
npm run test:facet-source-audit
```

The audit can write a detailed machine-readable inventory and a generated Markdown report:

```bash
npm run audit:facet-sources -- --write
```

Generated files are written to:

- `docs/facets/generated/facet-source-audit.json`
- `docs/facets/generated/facet-source-audit.md`

## Answer first

The repository currently has four competing creative-seed authorities:

1. Database `Facet` rows.
2. Curated `ADVENTURE_CARDS` choices with descriptions and local artwork.
3. Independent hardcoded pools in `generatorStore`.
4. `randomStore` / `randomHelper` / `stores/utils/random*.ts` legacy pools.

The art randomizer adds a fifth smaller source family for styles, themes, palettes, prompt enhancements, and negative prompts.

The curated Adventure Character Builder is the preferred migration source because it preserves the most information: labels, stored values, divisions, copy, ordering, and local art. Existing reviewed Facets come next, followed by rich `animalData`, then `generatorStore`, then the legacy random utility lists.

## Confirmed structural problems

### Species has multiple authorities

Species and animals appear in:

- `stores/helpers/adventureCards.ts`
- `stores/generatorStore.ts`
- `stores/utils/randomSpecies.ts`
- `stores/utils/randomAnimal.ts`
- `stores/utils/animalData.ts`
- the existing Facet database

These sources disagree about membership, naming, metadata, artwork, and category boundaries.

`randomSpecies.ts` is especially unsafe as a content authority because it creates random animal entries and hybrid species at module initialization. The available catalog can change between process starts and generated entries have no durable identity.

### Character Builder data is embedded as application code

The Character Builder contains the strongest data set, but its records are large `BuilderChoice` arrays rather than reusable domain records. Adding a choice there does not automatically add it to `generatorStore`, `randomStore`, Daily Dream generation, or the Facet library.

The audit extracts:

- card and step divisions;
- choice label and stored value;
- curated description;
- local image path;
- extended-list options;
- source order and source path.

### The current class bucket mixes different concepts

The Character Builder's `class` field currently combines:

- **Occupations:** Accountant, Doctor, Lawyer, Pilot, Xenobiologist.
- **Archetypes:** Wizard, Rogue, Oracle, Mad Scientist.
- **Narrative roles:** Reluctant Chosen One, The Bait, Ambient Threat, Ecosystem Keystone.

The existing Character field can remain `class` during compatibility, but the canonical Facets should preserve these divisions as `OCCUPATION`, `ARCHETYPE`, and `ROLE`.

### Dream-backed random lists disagree with the current API

The legacy random-list path requests `dreamType=RANDOMLIST`, while `RANDOMLIST` is not a current `DreamType`. The same path filters and creates rows as `BRAINSTORM`, then one update path writes `PITCH`.

Dream-backed random lists should not survive as the canonical content library. User-curated reusable concepts belong in Facets or, if ordered list ownership remains a product requirement, a dedicated list model that references Facets.

### Characters cannot currently own Facets

The current Facet assignment surface supports Dreams, Scenarios, and ArtImages. Character needs an explicit Facet join before the Character Builder can use Facets without collapsing its existing fields into loose strings.

## Taxonomy

### Existing kinds to retain

- `GENRE`
- `ANIMAL`
- `COLOR`
- `THEME`
- `CORE`
- `MOOD`
- `STYLE`
- `SETTING`
- `ART_DIRECTION`

### Proposed kinds to add

- `SPECIES`
- `OCCUPATION`
- `ARCHETYPE`
- `ROLE`
- `ALIGNMENT`
- `PERSONALITY`
- `BACKSTORY`
- `QUIRK`
- `MATERIAL`
- `PROMPT_ENHANCEMENT`

Taxonomy should describe what a concept **is**, not every field where it can be used. An Octopus remains an `ANIMAL` Facet even when assigned to a Character's `species` field. Assignment metadata records the usage role.

### Do not convert to Facets

Keep these programmatic:

- given and family names;
- generic honorific assembly;
- verbs and nouns;
- generic adjectives;
- rarity and stat rolls;
- negative prompt filters;
- procedural encounter assembly;
- procedural hybrid-species name construction.

Items, skills, pets, powers, magic, and favors should normally become or remain `Reward` objects rather than Facets.

Specific world locations should remain Dreams or future location records. A Facet can represent a reusable setting such as `underwater courtroom`; a named place with cast, history, and infrastructure is not lightweight flavor.

## Artwork policy

Local Character Builder artwork is protected migration data.

During import:

- `choice.label` becomes the Facet title;
- `choice.value` becomes the canonical value or an alias when it differs meaningfully;
- `choice.subtext` becomes description or flavor text;
- `choice.image` becomes `imagePath`;
- the current array position becomes `sortOrder`;
- the card and step become grouping and assignment metadata.

Artwork is expected for genres, animals, species, occupations, archetypes, roles, alignments, personalities, backstories, quirks, themes, cores, moods, styles, settings, art directions, and materials.

Individual colors and palette values do not require generated images. They should use CSS/metadata swatches.

Remote reference images in `animalData` can enrich review, but they do not replace curated local art.

## Source priority

When sources disagree:

1. Curated Adventure Builder choice with local art and copy.
2. Existing reviewed database Facet.
3. Rich `animalData` metadata.
4. `generatorStore` list.
5. `randomHelper` utility list.
6. Module-load-generated `randomSpecies` output.

Lower-priority sources may propose aliases or missing candidates. They must not overwrite curated copy or artwork.

Example:

- `Tardigrade` is canonical.
- `Water Bear` is an alias.
- Character Builder art wins.
- Scientific data from `animalData` enriches metadata.
- duplicate plain strings are discarded.

## Audit actions

Every normalized candidate receives one migration action:

- `import`: one clear reusable concept.
- `merge`: the concept appears in multiple sources.
- `alias`: safe alternate titles resolve to one canonical record.
- `retain-programmatic`: the entry is a lexicon or generation setting, not a Facet.
- `review`: the type is ambiguous, the entry belongs to Reward, or the term may be franchise-specific.

The audit also flags:

- conflicting type recommendations;
- multiple descriptions;
- multiple image paths;
- duplicates within one source;
- missing local artwork;
- franchise/IP-sensitive terms;
- expected source arrays that were renamed or removed.

No ambiguous row is silently classified.

## Recommended schema direction

The audit does not implement schema changes, but the next reviewed phase should add an explicit Character join with usage metadata:

```prisma
model CharacterFacet {
  characterId Int
  facetId     Int
  fieldKey    String         @db.VarChar(64)
  sortOrder   Int            @default(0)
  weight      Float?
  source      CreationSource @default(HUMAN)
  createdAt   DateTime       @default(now())

  Character Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  Facet     Facet     @relation(fields: [facetId], references: [id], onDelete: Cascade)

  @@id([characterId, facetId, fieldKey])
  @@index([facetId])
  @@index([characterId, fieldKey])
}
```

Expected `fieldKey` values include:

- `species`
- `genre`
- `occupation`
- `class`
- `alignment`
- `personality`
- `backstory`
- `quirk`

Facet also needs ordering, grouping, and random eligibility. The smallest useful additions are:

- `groupKey`
- `groupLabel`
- `sortOrder`
- `isRandomizable`
- `randomWeight`
- serialized `metadata`

A dedicated `FacetGroup` model may replace scalar grouping later, but the first migration should not lose the existing Character Builder divisions while waiting for the final abstraction.

## Target architecture

```text
Facet database
    |
    +-- facetStore: fetch, cache, alias resolution, grouped queries
    +-- Character Builder: curated Facet galleries
    +-- randomStore: weighted random selection from eligible Facets
    +-- generatorStore: combines selections into prose and prompts
    +-- Daily Dream: genre + occupation + animal/species seeds
    +-- Dream / Scenario / Character / Art assignments
```

`randomStore` remains the dice cup. It stops being the encyclopedia.

`generatorStore` remains the recipe engine. It stops maintaining independent copies of the ingredients.

## Migration sequence

### Phase 1 — inventory and review

- Run and review the generated JSON inventory.
- Resolve ambiguous class entries.
- identify franchise-specific entries to exclude, rename, or keep private.
- verify every local Character Builder image path.
- compare the repository inventory with live database Facets.

### Phase 2 — additive schema

- Expand `FacetKind`.
- add grouping, ordering, metadata, and randomization fields.
- add `CharacterFacet`.
- expand Facet API summaries so builders receive full art and presentation fields.

### Phase 3 — curated import

Migrate in this order:

1. species and animals;
2. occupations, archetypes, and roles;
3. genres;
4. alignments;
5. personalities;
6. backstories;
7. quirks.

Preserve all existing Character Builder artwork and ordering.

### Phase 4 — secondary pools

Migrate themes, styles, colors, palettes, cores, moods, settings, materials, art directions, and prompt enhancements.

### Phase 5 — compatibility reads

- Character Builder reads grouped Facets first.
- legacy arrays remain as fallback snapshots.
- randomStore draws domain concepts from Facets.
- generatorStore combines Facets but retains procedural lexicons.

### Phase 6 — cleanup

Only after parity checks:

- remove duplicate domain arrays from `generatorStore`;
- remove duplicate domain pools from `randomHelper`;
- retire `randomAnimal.ts`;
- retire module-scope generated `speciesList`;
- retire Dream-backed pseudo-random lists;
- remove compatibility fallbacks.

## Guardrails

- No database writes in the audit phase.
- No destructive schema change before the generated inventory is reviewed.
- No loss of local Character Builder artwork.
- No flattening occupations, archetypes, and narrative roles into one undifferentiated class taxonomy.
- No automatic import of franchise-specific names.
- No duplicate canonical Facets for the same concept merely because it fills different object fields.
- No permanent dual source of truth.
