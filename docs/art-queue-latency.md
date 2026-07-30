# ArtJob turnaround latency

The home relay remains pull-only and durable. Responsiveness comes from two coordinated settings:

- the relay claims work every two seconds by default;
- the claim endpoint uses a cheap indexed probe while the queue is empty, only entering stale recovery and smart-queue selection when work may exist.

While a Project generation form remains open, its local status display also checks completion every two seconds. Closing the page does not affect rendering or attachment; reopening a Project view fetches canonical database state.
