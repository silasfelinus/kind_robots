# ChatGPT Admin Action

Kind Robots exposes its existing machine-content API as a private Custom GPT Action for
ChatGPT Plus users. This gives ChatGPT authenticated access to supported live Kind Robots
records without ever putting the admin credential in a conversation.

## Production endpoints

- Action schema: `https://kind-robots.vercel.app/api/chatgpt/openapi`
- Machine API: `https://kind-robots.vercel.app/api/chatgpt`

The action schema is public metadata. The machine API is not public: every operation still
passes through the normal Kind Robots machine-user auth guard.

## Credential

Production already uses `ADMIN_TOKEN`. `server/utils/authGuard.ts` accepts that token as
Bearer auth, validates the configured admin user, and resolves the request as an admin
machine actor.

Do not add the token to this repository, prompts, GPT instructions, knowledge files, or
request bodies.

## One-time ChatGPT Plus setup

1. Open the GPT editor on chatgpt.com and create a private GPT, for example **Kind Robots Admin**.
2. In **Configure → Actions**, create a new action.
3. Set **Authentication** to **API key** and choose **Bearer**.
4. Paste the value of `ADMIN_TOKEN` into the action's secret credential field. This is a
   configuration secret, not conversation content.
5. Import the OpenAPI schema from
   `https://kind-robots.vercel.app/api/chatgpt/openapi`.
6. In Preview, ask the GPT to run `meta.describe`. A successful response identifies the
   actor role as `admin` and the auth source as `beta-admin-token`.
7. Keep the GPT private unless there is a deliberate reason to share its admin capability.

The API key is then supplied by ChatGPT as an `Authorization: Bearer ...` header. It is not
part of the tool arguments visible to the model.

## Supported operations

The action intentionally fronts the existing machine-content API instead of creating a
second admin implementation:

- `meta.describe`
- `content.create`
- `content.get`
- `content.list`
- `content.update`
- `content.setActive`
- `image.upload`
- `image.get`
- `relation.add`
- `relation.remove`
- `relation.list`

Call `meta.describe` before guessing fields on an unfamiliar model. It reports the current
resource registry, readable/writable fields, filter fields, and authenticated actor.

The generic API redacts configured credentials and private fields. It uses soft activation
where supported rather than exposing a generic hard-delete operation.

## Why this is an Action instead of MCP on Plus

As of August 2026, ChatGPT Plus can build and use custom GPTs with Actions. Full custom MCP
apps with write/modify actions are currently available to Business and Enterprise/Edu
workspaces, not Plus. The machine-content service behind this Action can later be wrapped by
an MCP transport without changing its authentication or content policy.

## Security model

- `ADMIN_TOKEN` remains the server's configured admin credential and the GPT Action's stored
  API-key credential.
- The public OpenAPI endpoint contains no secret.
- The GPT sends the credential only in the Authorization header.
- The machine-content API resolves the credential through the same `authGuard.ts` used by
  other authenticated machine clients.
- Admin-only resources remain admin-only.
- Generic responses redact configured secret/private fields.
- No generic hard-delete operation is exposed.
