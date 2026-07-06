---
# TEMPLATE — copy to /content/samples.md. The filename IS the route (/samples).
# One page per channel; the body is a single manager component directive.
# Valid frontmatter fields are enforced by content.config.ts — the old
# gallery/tags/layout/category/navComponent fields no longer exist.
title: Samples
room: Sample Vault
subtitle: A best-practices model, front to back
description: Browse, create, and edit Sample entries.
image: nav/heroes/samples.webp # channel hero — see README image checklist
icon: kind-icon:sample
tooltip: The reference implementation for new models.
dottitip: Good samples are like seeds for future brilliance.
amitip: I once added a “Banana Oracle.” No regrets.
sort: highlight
dashboardKey: sample # must be registered in stores/helpers/dashboardHelper.ts
dashboardTab: gallery # the channel's defaultTab
cards: navCards
loadingMessage: Loading samples...
refreshLabel: Refresh Samples
---

:sample-manager
