---
contentType: tab
channelKey: admin
tabKey: arcade-audio
label: Arcade Audio
title: Arcade Soundtrack Studio
subtitle: Private soundtrack approval queue and relay readiness
summary: Review and approve Arcade soundtrack briefs.
description: Private admin studio for reviewing each Arcade music and sound cue, relay readiness, and existing render jobs before explicitly approving a private render.
icon: kind-icon:music
route: /admin/arcade-audio
sort: 66
requiredRole: ADMIN
tutorial:
  title: Arcade soundtrack approval
  body: >-
    Review a cabinet and cue, its music brief, and the current audio relay.
    An approval creates a private ArtJob only when the server has enabled
    soundtrack generation and an audio-capable relay is live. An existing
    pending, running, or completed job is not submitted again. A completed
    job still needs verified ingestion and approval as a playable asset;
    this page does not automatically publish audio or spend on load.
---

Review the private Arcade sound queue before approving any generation.
