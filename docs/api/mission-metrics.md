# Rainbow Butterflies mission metrics

Rainbow Butterflies uses a deliberately small first-party measurement surface so launch experiments can be evaluated without adding a surveillance stack.

## What is recorded

`POST /api/v1/mission/events` accepts only three anonymous event types:

- `visit`
- `return_visit`
- `fundraiser_click`

Each event may carry three low-cardinality labels: `source`, `campaign`, and `placement`. Unknown request fields are rejected. The values are not stored as arbitrary client text: source, campaign, and placement are normalized into small checked-in vocabularies, with unknown source/campaign values collapsing to `other` and unknown placements to `unknown`. This keeps query strings from becoming an accidental free-form analytics field.

Accepted events are written to the existing Kind Robots `Log` model as JSON with `username = rainbow-metrics` and `userId = null`. The payload contains only the event and those three coarse bucket labels. It does not contain a visitor identifier, account id, IP address, user agent, referrer, full URL, browser fingerprint, or arbitrary metadata.

Event timestamps are deliberately reduced to the UTC day (`00:00:00`) before storage. The reporting goal is a daily funnel, so retaining an exact visit/click time would add needless identifying detail without improving the decision signal.

The public ingest endpoint uses the request IP transiently in process memory for a one-minute anti-abuse rate-limit bucket. The IP is not persisted, logged, returned, hashed into a durable identifier, or combined with other signals.

## What is derived from canonical Kind Robots state

`GET /api/v1/mission/summary?days=30` returns aggregate counts for a 1–90 day UTC window.

Rather than trusting browser events for product activity, it derives these figures from canonical Kind Robots records:

- public human forum contributions from active/public `Chat` rows with no author Bot;
- public AI-agent forum contributions from active/public `Chat` rows with an author Bot;
- completed Rainbow Butterflies art-generation objects from durable `ArtJob` rows with `projectSlug = rainbow-butterflies`;
- public forum posts carrying a canonical ArtImage, Project, or Character attachment.

Anonymous event rows provide only first/returning visit counts and outbound fundraiser-click attribution. The summary exposes coarse source/campaign and page-placement breakdowns for fundraiser clicks plus a daily event series.

## Return visits

The Rainbow Butterflies client may store a boolean `seen before` marker and the last UTC day on which a visit was counted. Those values contain no random id and are never sent to Kind Robots. They exist only so one browser is not counted repeatedly on every reload and so a later visit can be classified as returning.

Campaign attribution may persist the already-bucketed source/campaign labels themselves. It does not persist the referring URL or a visitor id.

## Donation boundary

Against Malaria remains the donation processor. These metrics record only that a visitor followed the outbound fundraiser link. They do **not** establish that a donation occurred, identify a donor, or reveal a donation amount.

The summary response therefore explicitly reports that donor identities and donation amounts are unknown. Any future verified AMF integration must be designed and documented separately rather than inferred from click behavior.
