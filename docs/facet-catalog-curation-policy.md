# Facet catalog curation policy

The Facet catalog is a creative vocabulary, not a landfill or a thesaurus. Curation should preserve useful specificity while keeping random generation legible, recombinable, and proportionate.

## Core rules

### Art-backed Facets

An attached image, collection, card, hero, icon, prompt, or joined artwork record is evidence that the Facet was deliberately authored.

- Keep the stable Facet id.
- Keep the existing title when a rename would materially shift the art's tone.
- Keep descriptions, examples, flavor text, prompts, and image relationships unless a human explicitly approves a rewrite.
- Prefer taxonomy changes, aliases, RELATED links, and recipe decomposition over replacement.
- A classification move such as GENRE to SETTING is normally safe because it preserves the authored concept.

### Exact synonyms

Merge only when two Facets are genuinely interchangeable in use, not merely adjacent.

A safe merge must migrate:

- Character, Bot, Reward, Dream, and Scenario assignments
- Reactions
- aliases
- inbound and outbound Facet relationships
- direct and joined artwork
- profile metadata

The richer or art-backed row should normally be canonical. The retired row should remain inactive with an audit marker.

### Near synonyms

Do not force aliases for concepts that can produce meaningfully different results.

Examples such as Practical, Pragmatic, and Realistic should remain separate and may receive RELATED relationships. Alias resolution should never erase a useful shade of meaning.

### Composite Facets

A title that combines genre, mood, setting, perspective, character state, or premise should normally become a recipe.

- Keep the historic composite row.
- Mark it nonrandom with weight 0.
- Create or reuse component Facets.
- Link the recipe to its components with CONTAINS.

This preserves old assignments while allowing future generation to recombine the parts.

### Random weights

Random selection should reflect breadth and reuse potential.

- 3.0: foundational genres
- 1.5: established subgenres and broadly reusable forms
- 0.75 to 1.0: broad themes, settings, moods, and cultural umbrellas
- 0.5: authored house genres and unusually specific concepts
- 0: recipes, retired duplicates, and controls removed from random selection

### Low-value prompt controls

Resolution claims, quality incantations, and similarly vague prompt cargo should leave random selection before deletion is considered.

Examples include `4k render`, `award-winning`, and `best quality`. Keeping the record nonrandom protects historical references without spending generation probability on empty wording.

### Cultural labels

Prefer precise traditions over continental shorthand, but retain broad umbrellas when they are genuinely useful.

- Mark broad umbrellas as broad.
- Downweight them.
- Encourage pairing with a named culture, region, language, or tradition.
- Do not collapse distinct established frameworks into aliases.
- Preserve legacy labels as aliases when renaming an unillustrated record.

## Batch order

Production builds apply curation after all legacy source seeders and canonical duplicate repair:

1. structural genre and setting repair
2. art-backed house genre relationships
3. cultural genre refinement
4. exact synonym migration
5. general taxonomy leak repair
6. subject, cast, and remaining genre hybrid repair
7. whole-catalog audit

The final audit is read-only. It reports the next ranked candidates and never mutates production data.
