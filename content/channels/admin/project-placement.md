---
contentType: tab
channelKey: admin
tabKey: project-placement
dashboardKey: conductor
dashboardTab: conductor
label: Project Placement
title: Project Placement
subtitle: Write the channel and tab map onto Project records
description: Apply the canonical channel, tab, and live URL map to existing Project records and read a report of the result.
icon: kind-icon:map
route: /project-placement
sort: 30
navigation: false
requiredRole: ADMIN
loadingMessage: Loading project placement controls...
refreshLabel: Reload Projects
dottiTip: I turned the migration script into a button with a report and several opportunities to reconsider.
amiTip: That is what responsible danger looks like.
tutorial:
  title: Project Placement
  body: >-
    A one-off backfill that writes the canonical channel, tab, and live URL map
    onto existing Project records. Press Load projects, decide whether to tick
    Overwrite live URLs, then press Apply placements. The report sorts every
    slug into Updated, Unchanged, Missing, or Failed.
---

Apply the canonical navigation placement map to existing Project records and inspect every changed, unchanged, or missing slug.
