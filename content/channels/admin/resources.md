---
contentType: tab
channelKey: admin
tabKey: resources
label: Resources
title: Resource Gallery
subtitle: Checkpoints and LoRAs for the art servers
description: Browse checkpoints and LoRAs, discover models to download, and track import progress and history.
summary: Browse and add art models.
icon: kind-icon:database
image: /images/channels/play/resources.webp
route: /resources
modelType: resource
sort: 76
requiredRole: ADMIN
tutorial:
  title: Resource Gallery
  body: >-
    Library shows the checkpoints and LoRAs the art servers can use. Flip a card
    to see its trigger words, server, file path, and the images made with it,
    then press Generate art for a preview, Add to build to put it in the art
    generator's current build, or Delete. Add registers a new Checkpoint or
    LoRA, and Discover searches Civitai or CivArchive by base model so you can
    download models you do not have yet. Downloads shows queued, claimed,
    completed, and failed imports. Retry individually or in batches, and clear
    completed/failed history records without deleting installed model files.
    Claims are not byte-level progress; completion is reported by the home
    downloader. The LoRA Triage button opens the maturity review.
  image: /images/art/resources.webp
---

Browse installed models, discover new ones, and monitor queued downloads.
