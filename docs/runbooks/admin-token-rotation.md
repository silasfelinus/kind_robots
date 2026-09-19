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
