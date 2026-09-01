# First-party Kind Robots SSO

Kind Robots is the identity authority for trusted first-party sites such as Rainbow Butterflies. The handoff is an authorization-code flow with an exact redirect allowlist and PKCE S256. A first-party site never receives a Kind Robots password or the long-lived `kind-session` JWT.

## Browser authorization

Send the browser to:

`GET /api/auth/first-party/authorize`

Required query parameters:

- `response_type=code`
- `client_id=rainbow-butterflies`
- `redirect_uri=https://rainbowbutterflies.org/auth/callback`
- `code_challenge=<PKCE S256 challenge>`
- `code_challenge_method=S256`
- `state=<high-entropy anti-forgery value>`

The redirect URI must exactly match a URI registered for the client. Invalid client or redirect input is rejected locally and is never followed, so the endpoint cannot be used as an open redirect.

If the browser has no valid `kind-session` cookie, Kind Robots sends it through `/login` with a same-origin `returnTo` value. After a successful password login, the browser resumes the authorization request. The authorization code is random, stored only as a SHA-256 hash, expires after two minutes, and is single use.

On success the browser is redirected to the registered callback with `code` and the original `state` query values.

## Server-side exchange

The first-party backend exchanges the code with:

`POST /api/auth/first-party/exchange`

JSON body:

```json
{
  "grant_type": "authorization_code",
  "client_id": "rainbow-butterflies",
  "redirect_uri": "https://rainbowbutterflies.org/auth/callback",
  "code": "<authorization code>",
  "code_verifier": "<original PKCE verifier>"
}
```

A valid exchange returns only the minimum identity handoff:

```json
{
  "success": true,
  "clientId": "rainbow-butterflies",
  "user": {
    "id": 123,
    "username": "example"
  }
}
```

The exchange does **not** return the user's Kind Robots password, password hash, API key, agent credential, or normal Kind Robots JWT. Rainbow Butterflies is expected to create its own short-lived HttpOnly session after validating `state` and completing this exchange.

The exchange locks the authorization-code row, verifies client, redirect URI, expiry, single-use state, and PKCE, then marks the row consumed in the same database transaction. Replay attempts receive the same generic invalid-code response as other invalid grants.

## Client registry

The built-in registry includes Rainbow Butterflies production plus local callback addresses. Deployments may replace the registry with `FIRST_PARTY_SSO_CLIENTS_JSON`, an array of objects with `id`, `label`, and `redirectUris`.

Only HTTPS redirect URIs are accepted, except `http://localhost` and `http://127.0.0.1` for development. Userinfo, fragments, malformed URLs, and unregistered destinations are rejected.
