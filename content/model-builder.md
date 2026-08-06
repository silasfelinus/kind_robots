---
title: Model Builder
room: 'Model Builder Room'
subtitle: Resumable, human-gated recipe runner
description: Select a Kind Robots source model, choose a recipe, and walk each output through pitch, fields, generation, and commit — editable and resumable at every gate.
icon: kind-icon:blueprint
tooltip: Upgrade or expand existing Kind Robots records through four reviewable gates.
channelKey: plan
tabKey: model-builder
dashboardKey: builder
dashboardTab: model-builder
cards: navCards
loadingMessage: Loading Model Builder…
refreshLabel: Refresh
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/model-builder-mobile
backgroundTablet: /api/art/backdrop/model-builder-tablet
backgroundDesktop: /api/art/backdrop/model-builder-desktop
---

:model-builder-manager
