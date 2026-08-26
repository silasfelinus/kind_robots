from pathlib import Path

path = Path('prisma/schema.prisma')
text = path.read_text()

replacements = [
    (
        '''  /// Collection/economy tier, COMMON..MYTHIC -- matches the fish bible's
  /// `tier` and economy.yaml's rarity_tiers lookup key. This is the
  /// canonical field server/utils/aquariumEconomy.ts's deriveFishRarityTier
  /// has been waiting on; Character never had one (see that function's own
  /// doc comment, which this model finally resolves).
  tier                Rarity         @default(COMMON)''',
        '''  /// Collection/economy tier, COMMON..MYTHIC -- matches the fish bible's
  /// `rarity` (NOT its own unrelated `tier` field -- see `depth` below) and
  /// economy.yaml's rarity_tiers lookup key. This is the canonical field
  /// server/utils/aquariumEconomy.ts's deriveFishRarityTier has been waiting
  /// on; Character never had one (see that function's own doc comment,
  /// which this model finally resolves).
  tier                Rarity         @default(COMMON)''',
    ),
    (
        '''  unlockCost          Int?
  /// Free-form ecological role tag (the fish bible's diet_role/school_role
  /// feed economy.yaml's rivalry.emergent_rules -- predator/prey,
  /// school/anchor/solitary). Exact taxonomy and consumption belongs to
  /// whichever task wires the rivalry economy (t-030 or a successor);
  /// stored as free text for the same reason AquariumEvent.kind and
  /// AquariumSet.kind are -- a new tag is a data commit, not a migration.
  behavior            String?        @db.VarChar(255)''',
        '''  unlockCost          Int?
  /// The bible's own 1-5 "roughly how deep into the game it appears"
  /// integer (cthulhuquarium/t-042) -- unrelated to the `tier` Rarity
  /// column above, hence the different name rather than a second `tier`.
  /// Nothing reads this yet.
  depth               Int?
  /// The RENDERER's movement mode -- drift, dart, lurk, school, anchor,
  /// surface, hover, tumble, cling -- the fish bible's own `behavior`
  /// field, name-for-name. Previously mis-documented here as the bible's
  /// diet_role/school_role (predator/prey, school/anchor/solitary
  /// ecological roles); those are a DIFFERENT pair of bible fields and now
  /// have their own columns below (cthulhuquarium/t-042). Stored as free
  /// text for the same reason AquariumEvent.kind and AquariumSet.kind are
  /// -- a new tag is a data commit, not a migration.
  behavior            String?        @db.VarChar(255)
  /// The fish bible's `diet_role` (predator/prey) -- feeds
  /// economy.yaml's rivalry.emergent_rules. Exact taxonomy and consumption
  /// belongs to whichever task wires the rivalry economy (t-030 or a
  /// successor); stored as free text, same convention as `behavior`.
  dietRole            String?        @db.VarChar(255)
  /// The fish bible's `school_role` (school/anchor/solitary) -- feeds
  /// economy.yaml's rivalry.emergent_rules alongside `dietRole`. Same
  /// free-text convention.
  schoolRole          String?        @db.VarChar(255)''',
    ),
    (
        '''  /// growth: a species matures into the next one (the goldfish line is the
  /// named example). breeding: a "secret evolution" that only appears by
  /// pairing two owned individuals (t-029). Required whenever evolvesToId
  /// is set; omit both on a species with no further evolution.
  evolutionKind       EvolutionKind?''',
        '''  /// growth: a species matures into the next one (the goldfish line is the
  /// named example). breeding: a "secret evolution" that only appears by
  /// pairing two owned individuals (t-029). secret: a hidden individual-
  /// stat roll rather than a pairing (cthulhuquarium/t-042) -- a different
  /// mechanic from breeding despite the similar-sounding name. Required
  /// whenever evolvesToId is set; omit both on a species with no further
  /// evolution.
  evolutionKind       EvolutionKind?''',
    ),
    (
        '''/// cthulhuquarium/t-035: which mechanism unlocks a Monster.evolvesToId --
/// see that field's own doc comment. Both were already named in the fish
/// bible's SCHEMA.md (external, conductor repo) before this table existed.
enum EvolutionKind {
  GROWTH
  BREEDING
}''',
        '''/// cthulhuquarium/t-035: which mechanism unlocks a Monster.evolvesToId --
/// see that field's own doc comment. All three were already named in the
/// fish bible's SCHEMA.md (external, conductor repo) before this table
/// existed. SECRET added cthulhuquarium/t-042 -- the bible's third
/// evolution_kind value had no matching enum member until now.
enum EvolutionKind {
  GROWTH
  BREEDING
  SECRET
}''',
    ),
]

for old, new in replacements:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'expected exactly one schema match, found {count}')
    text = text.replace(old, new, 1)

path.write_text(text)
print('restored all four t-042 schema fragments')
