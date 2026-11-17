# K8 Wildlife: Kind Robots ↔ Critical Mass

Kind Robots hosts the art-led animal selector. Critical Mass remains the sole
authority for fund configuration, current engine status, positions and animal
profile overrides.

## Protocol

- Kind Robots: `GET /api/k8/fund`, `PUT /api/k8/fund/levels`, and
  `PUT /api/k8/fund/risk`; all require a signed-in Kind Robots human
  authorized as K8 or an administrator. Administrators are read-only.
- The Kind Robots Nitro server sends an `x-k8-bridge-token` header ONLY to
  `https://critical-mass.acrocatranch.com/api/k8/fund[...]`. The browser
  never receives that token, and the upstream request is not a general-purpose
  URL proxy.
- Critical Mass checks the token in constant time and accepts it ONLY on
  fund-snapshot GET and the two specific fund PUT endpoints. It does not grant
  access to operator settings, invites, credentials, or another exchange fund.
- The bridge must be present on **both** servers as the same independently
  generated, at least 32-character secret named `K8_BRIDGE_TOKEN`.
  **Do not store the value in Git or in Nuxt public runtime configuration.**
  Secret provisioning and production deployment are separate human operations.
  No secret values are bundled here.
- `NUXT_PUBLIC_K8_PORTAL_URL` remains the optional public project-link
  override, but the bridge deliberately rejects alternate hosts; redirecting
  private fund data to an arbitrary hostname would be unsafe.

## Behavior and safety

- The slider changes only Kind Robots' local preview state.
- `GET /api/k8/fund` returns scoped metrics, current saved/applied levels,
  and a SHA-256 snapshot fingerprint from Critical Mass. Never label fund equity
  as an exchange account balance.
- K8's editable animal profile is persisted by Critical Mass via
  `PUT /api/k8/fund/levels`. This DOES NOT change the running strategy.
- A separate review dialog is mandatory before
  `PUT /api/k8/fund/risk`. Critical Mass checks the fingerprint and
  validates the configured limits and engine availability before applying.
- Level 0 requests engine stop only. It does not liquidate positions or
  cancel resting orders. Other levels change the scoped regime's risk profile
  but do not change the operator's capital or drawdown ceiling.
- A missing secret, network failure, invalid fund or stale fingerprint causes
  a visible error, with edits unavailable until a fresh successful snapshot.
  Never substitute synthetic portfolio balances.

## Acceptance before release

1. Confirm all GitHub Actions checks have completed successfully on BOTH PRs.
2. Independently review the scoped auth boundary and both read/write routes.
3. Provision the bridge secret separately on both services with human approval.
4. Deploy the two repositories separately only after authorization.
5. From signed-in K8 and admin accounts, verify the UI at phone, tablet and
   desktop widths, all eleven responsive artworks, profile save/reload,
   admin read-only access, stale-fingerprint rejection, and that the slider
   alone never changes the engine. Test write flows only with an explicitly
   approved non-live fund.
