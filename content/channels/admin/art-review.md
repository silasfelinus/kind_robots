---
contentType: tab
channelKey: admin
tabKey: art-review
label: Checkpoint Review
title: Checkpoint Review
subtitle: Every Ecotone render side by side, with generation times
description: Compare the Ecotone checkpoint bake-off and art rounds side by side, with render and queue times per image and per checkpoint, and shortlist the checkpoints that become Ecotone art styles. Temporary.
icon: kind-icon:image
route: /admin/art-review
sort: 77
requiredRole: ADMIN
tutorial:
  title: Checkpoint Review
  body: >-
    A temporary page for picking Ecotone's art styles. The Checkpoint bake-off
    tab runs eight checkpoints over the same eight subjects (the four
    companions and four Humboldt settings), one seed per subject; the Round
    tabs show every render from Ecotone's art rounds. Each checkpoint card
    gives how many renders finished, failed or are still waiting, and the
    median, fastest and slowest render time. Render time runs from the art
    relay claiming a job to its image being saved, so it includes loading the
    model and the upload; the first job on a checkpoint pays the model load,
    so the median is the fairest comparison. Click any render for the full
    image, its settings and prompt. Shortlist the two to four checkpoints you
    want, and tell Claude: they become Ecotone art styles.
  image: /images/art/resources.webp
---

Compare every Ecotone render side by side, with generation times, and shortlist the checkpoints that become art styles.
