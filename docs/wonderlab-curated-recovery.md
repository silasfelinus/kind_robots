# WonderLab curated recovery publication

The curated recovery workflow publishes only explicitly listed review drafts that already exist in production and have been manually rewritten in the checked-in manifest.

It does not generate reviews. Each row locks the draft ID, Component ID, first-party reviewer, expected current status, edited comment, rating, and reaction type. A failed or rejected draft must first transition back to `PROPOSED`, then to `APPROVED`, before the existing publication endpoint creates its Reaction.

The workflow stops if any reviewed identity or status has changed. After publication it requires a ready rollout audit with zero duplicate first-party groups, zero unsafe first-party rows, and zero published-draft link mismatches.
