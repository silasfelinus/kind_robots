# Rotating the Kind Robots admin token

The credential that Conductor calls `KR_API_TOKEN`, that the ChatGPT Action calls
`ADMIN_TOKEN`, and that this repo's auth code calls the _beta admin token_ are all
**the same single string**. This runbook is how you replace it.

Use it whenever the value has leaked, is suspected to have leaked, or has been
pasted anywhere it shouldn't live (a commit, a chat transcript, a log line, a
screen share, a support ticket).

## What this credential actually is

`server/utils/authGuard.ts` resolves it in `getConfiguredBetaAdminToken()`:

```ts
config.betaAdminToken ||
  config.adminToken ||
  process.env.BETA_ADMIN_TOKEN ||
  process.env.ADMIN_TOKEN
```

`betaAdminToken`/`adminToken` are **not** declared in `nuxt.config.ts`'s
`runtimeConfig`, so those two branches are always empty in practice and only the
two `process.env` names are live. `server/utils/validateKey.ts` reads the same
pair in the opposite order. Either variable name works; set **one** and keep it
that way, because two disagreeing values are silently resolved by precedence
rather than reported as a conflict.

Facts that shape the rotation:

- **It is compared as plaintext** (`suppliedToken !== configuredToken`). There is
  no hash, no expiry, no revocation list, no per-caller identity, and nothing
  records which caller used it. It cannot be revoked individually — the only
  revocation is changing the value.
- **It grants full admin**, as whichever user `BETA_ADMIN_USER_ID` names
  (default `1`). The guard returns `isAdmin: true, isServerKey: true`. Every
  `requireAdminApiUser` route in the repo is reachable with it.
- **Four headers are accepted**: `x-beta-admin-token`, `x-admin-token`,
  `x-api-key`, and `Authorization: Bearer`. A leaked value is usable from any
  of them, so there is no "only one integration knows the header" comfort.
- **There is exactly one value, shared by every consumer.** No dual-accept or
  overlap window exists in the code, so the moment the server flips, every
  consumer still holding the old value gets a 401 until it is updated too.
  Plan for a short window, or update the consumers first (see step 3).

## First: which credential are you actually holding?

There are **two different things** that both work as "the admin token", and they
rotate in completely different places. Find out which one you have before you
touch anything:

```bash
curl -sS https://kindrobots.org/api/chatgpt \
  -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"operation":"meta.describe"}'
```

The response's `actor` block answers it, and also hands you the `userId` you
will need below:

- `"source": "beta-admin-token"` → it is the `ADMIN_TOKEN` / `BETA_ADMIN_TOKEN`
  **environment variable**. Rotate it with steps 1-4 below.
- `"source": "user-api-key"` → it is the `apiKey` **column on your User row**
  (`server/utils/authGuard.ts`'s `validateUserApiKeyAuth`, `where: { apiKey: token }`).
  It grants admin because your user holds an admin role. Rotate it with the
  section "Rotating a User.apiKey" below — the environment variable is not
  involved and changing it will do nothing.

Both resolve through the same four headers and both produce an admin actor, so
they are indistinguishable from the calling side. `meta.describe` is the only
cheap way to tell them apart.

## 1. Generate the new value

32 random bytes, hex. Any of these:

```bash
openssl rand -hex 32
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
-join ($bytes | ForEach-Object { $_.ToString('x2') })
```

Hex specifically, and no dots: `getOptionalApiUser` tries the scoped
`AgentCredential` path (`<keyPrefix>.<secret>`) _before_ the admin-token path, so
a dotted value takes a pointless detour through a database lookup on every
request. Hex sidesteps that and survives every shell, YAML file and container
template it has to pass through unquoted.

Put it straight into a password manager entry before pasting it anywhere else.
Do not echo it into a terminal you are sharing or recording — and if you need to
check whether it is set in a shell, use Conductor's `scripts/kr_token_set.sh`,
which reports presence only.

## 2. Inventory: everywhere the old value lives

Rotation is only complete when every one of these carries the new value. Work
from this list, not from memory.

**The authority — set this one and the token is changed:**

| Where                             | Name                                  | Notes                                                                                                                                                                                       |
| --------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alexandria `KindRobots` container | `ADMIN_TOKEN` (or `BETA_ADMIN_TOKEN`) | Unraid DockerMan template variable, and/or the `.env` beside `docker-compose.yml` that `env_file: ${KIND_ROBOTS_ENV_FILE:-.env}` loads. Whichever path actually sets it today — check both. |

**Consumers that will 401 until updated:**

| Where                                                     | Name                                                                                                                                                                  |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conductor repo → Settings → Secrets → Actions             | `KR_API_TOKEN` (read by 16 workflows, including `hourly-conductor.yml`, `daily-digest.yml`, `worker.yml`, `auto-art-generate.yml`, `sync-kind-robots-projection.yml`) |
| kind_robots repo → Settings → Secrets → Actions           | `CYPRESS_BETA_ADMIN_TOKEN` (`cypress.yml`; `cleanup-test-users.yml` passes it as `ADMIN_TOKEN`)                                                                       |
| Home render box, pm2 art relay                            | `KR_API_TOKEN` — restart the pm2 process, env is read at start                                                                                                        |
| Alexandria `healthcheck.ps1` render watchdog              | `KR_API_TOKEN` (machine env via `setx`; open a **new** shell afterwards)                                                                                              |
| Serendipity / Alexa relay                                 | `SERENDIPITY_KR_SERVICE_TOKEN`                                                                                                                                        |
| ChatGPT Custom GPT → Configure → Actions → Authentication | stored Bearer API key (see `docs/chatgpt-admin-action.md`)                                                                                                            |
| Your own shells                                           | Windows `setx KR_API_TOKEN`, WSL/bash profile, any `.env` in a local checkout                                                                                         |

**The retired Vercel project — do not skip this.** `AGENTS.md` records Vercel as
retired infrastructure, but the `kind-robots` Vercel project still holds
`ADMIN_TOKEN` and `KR_API_TOKEN` environment variables and still has a READY
production deployment serving on its `*.vercel.app` hostname. If that deployment
talks to the production database, **the old token keeps working there after you
rotate Alexandria**, and the rotation has accomplished nothing. Either delete
those two environment variables and the deployment, or rotate them alongside
everything else. Decide deliberately; do not leave it unexamined.

## 3. Cut over

Order matters only in which direction you want the brief failure:

- **Server first** (simplest): update Alexandria, restart the container, then
  work down the consumer list. Scheduled workflows that fire in the gap fail
  with 401 and can be re-run afterwards.
- **Consumers first** (shortest outage): update every consumer to the new value
  while the server still accepts the old one — they 401 until the server flips —
  then flip the server last. Only worth it if something time-sensitive is
  mid-flight.

On Alexandria, the container has to be **recreated**, not just restarted in
place, for a changed DockerMan template variable to take effect. The 5-minute
Kind Robots auto-deploy User Script (`docs/runbooks/unraid-auto-deploy.md`) does
not pick up env changes on its own — it recreates the container on _image_
change. Force an update/recreate of `KindRobots` from DockerMan, or, on the
compose path, `docker compose up -d` after editing `.env`.

## 4. Verify

New value works, and reports the right auth source:

```bash
curl -sS https://kindrobots.org/api/chatgpt \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"operation":"meta.describe"}'
```

A success identifies the actor role as `admin` and the auth source as
`beta-admin-token`.

**Then confirm the old value is dead** — this is the step that proves the
rotation, and it is the one most often skipped:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://kindrobots.org/api/chatgpt \
  -H "Authorization: Bearer $OLD_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"operation":"meta.describe"}'
```

Expect `401`. Anything else means a second deployment is still serving the old
env — see the Vercel note in step 2.

Then re-run one Conductor workflow by hand (`sync-kind-robots-projection.yml` is
cheap and its first step is literally `test -n "${KR_API_TOKEN:-}"`) to confirm
the Actions secret took.

## 5. After a leak specifically

- Assume everything the token can reach was reachable for the whole exposure
  window. It is admin as user 1, so that is the full admin API surface.
- Scrub the place it leaked. A value in a git commit stays in history until the
  history is rewritten or the repo's secret scanning flags it; rotating does not
  remove it, it only makes the exposed copy useless.
- Check whether the same window exposed anything else from the same file or
  transcript — `.env` leaks are rarely one variable.

## Rotating a `User.apiKey`

**Nothing in this codebase ever writes `User.apiKey`.** It is read by
`authGuard.ts` and `validateKey.ts`, returned to its own owner by
`GET /api/users/[id]`, and that is the entire surface. `PATCH /api/users/[id]`
excludes it by name from its self-editable allowlist ("identity/secrets:
apiKey, token, password..."). So the column was set by a direct database write
or a seed, and the obvious way to change it is another direct write — which is
exactly the option you do not have when Adminer is unreachable.

There is a way through the API. The generic machine-content endpoint can write
it, because `hiddenFields` in `server/chatgpt/registry/currentModels.ts` gates
**reads only** — it controls the `select` used to build responses. The write
path filters against `PROTECTED_WRITE_FIELDS`, which is only
`['id', 'createdAt', 'updatedAt']`. `apiKey` is an ordinary User scalar, so
`content.update` writes it.

### Authenticating the rotation

You need _an_ admin credential to make the call. Two work, and the second is
the one that matters after a leak:

**The old key itself**, if you still hold it. It authorizes the call that
retires it.

**A password login**, if you do not. This is the important case: after a leak
you have usually already overwritten the old value everywhere you kept it, so
the only copy left is the one in the database — the exact row you are trying to
change.

```bash
curl -sS https://kindrobots.org/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"<your username>","password":"<your password>"}'
```

The response's `data.token` is a JWT (`server/api/auth/index.ts`'s
`createToken`, 360-day expiry, carrying your `id` claim).
`getOptionalApiUser` tries `validateJwtAuth` **first**, and it resolves your
admin role exactly as the API key does — so the JWT is an admin actor for every
call below. Use it as the Bearer token wherever this runbook says `$OLD_TOKEN`.

This is the escape hatch when the database GUI is also unreachable: it needs
nothing but your password, and it does not depend on the credential you are
rotating.

Get your `userId` from `meta.describe` (using whichever credential you just
established), then:

```bash
curl -sS https://kindrobots.org/api/chatgpt \
  -H "Authorization: Bearer $OLD_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"operation":"content.update","resource":"user","id":<YOUR_USER_ID>,
       "data":{"apiKey":"<NEW_TOKEN>"}}'
```

Notes on why this works and what it requires:

- The `user` resource is `adminOnly: true`, and your key already resolves as an
  admin actor — that is the whole reason it works as `KR_API_TOKEN`. A
  non-admin key cannot do this.
- The write is atomic: the moment it lands, the old value stops
  authenticating. If you authenticated with the old key, expect the _next_ call
  with it to 401 — that is the confirmation, not a failure. A JWT keeps working,
  since it is not the credential being changed.
- The response will **not** echo the new key back — `apiKey` is in
  `hiddenFields`, so it is redacted out of the response `select`. Have the new
  value saved before you send the request.
- No deploy and no container restart. The change is a database row; it takes
  effect on the next request.

Then work the consumer list in step 2 as usual, and verify with step 4.

### A related thing worth knowing

That same read/write asymmetry means an admin actor can write **every** field
in `hiddenFields` — `password`, `token`, `googleId`, `stripeCustomerId` — on
**any** user row, not just their own. It is admin-gated, so it is not a
privilege boundary break. But it does mean an exposed admin credential is
full control of every account, not just read access to them, which is worth
knowing when you are sizing up what a leak could have done.

## Why not just use a scoped credential instead

This repo already has the better mechanism: `AgentCredential`
(`server/utils/agentCredentials.ts`) issues per-caller tokens that are bcrypt-
hashed at rest, carry explicit scopes, can expire, record `lastUsedAt`, and can
be revoked one at a time. Mint one from the user dashboard
(`components/user/agent-credentials-panel.vue`) or `POST /api/agent-credentials`.

It is **not** a drop-in replacement here: `validateAgentCredentialAuth` returns
`isAdmin: false` by design, so a scoped credential cannot reach the
`requireAdminApiUser` routes that most of Conductor's automation calls. Moving a
consumer off the shared admin token means first establishing which scopes it
actually needs. Worth doing per-consumer over time; not worth attempting in the
middle of an incident.
