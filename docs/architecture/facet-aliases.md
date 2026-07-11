# Facet aliases

Facets have one canonical `slug` plus any number of explicit aliases in `FacetAlias`.
Every alias owns a globally unique `lookupKey`, so one spelling can never resolve to
multiple Facets.

## Normalization

Lookup normalization ignores formatting but does not guess meaning:

- `cowCore`, `cow-core`, and `cow core` all normalize to `cowcore`.
- `cow` and `cows` remain different keys and must both be assigned explicitly.

This avoids unsafe stemming while still making URLs and user input forgiving.

## Adding aliases

After the migration has been deployed, add aliases without removing existing ones:

```bash
npm run facet:alias -- cowcore cow cows
```

The first argument may be the Facet's canonical slug or an existing alias. Remaining
arguments are added idempotently. The command stops if an alias already belongs to a
different Facet.

## Resolution

`GET /api/facets/:key` resolves through the canonical slug and aliases. These all reach
the same Facet after the example command:

```text
/api/facets/cowcore
/api/facets/cowCore
/api/facets/cow-core
/api/facets/cow
/api/facets/cows
```

The response includes the canonical slug, matched alias, normalized lookup key, and
active aliases.

## Migration behavior

The migration creates one canonical alias row for every existing Facet with a slug.
It does not change or delete any Facet, Dream, Scenario, or existing relation.
