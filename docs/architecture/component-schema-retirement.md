# Component schema retirement

WonderLab and its Component runtime are retired. The final database retirement removes the raw-SQL `ReviewDraft` table, Component-targeted `Reaction` rows, `Reaction.componentId`, and the `Component` table in dependency order.

The historical voice corpus is **not** stored in those tables. It remains checked in as `config/wonderlab-voice-polish-batch-001.json` through `-039.json`, and the replacement comment pipeline reads those files as voice evidence.

`Reaction_reactionCategory.COMPONENT` remains temporarily as a retired enum sentinel so stale callers receive a deliberate unsupported-category response without requiring a broad MariaDB enum rewrite. New Component reactions cannot be created.

The migration is destructive and therefore must be reviewed and merged deliberately. Production applies Prisma migrations during deployment.
