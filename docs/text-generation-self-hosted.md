# Self-hosted text generation

Kind Robots treats a private, self-hosted text server as a first-class
alternative to the cloud providers (OpenAI, Anthropic) — not a special case.
This doc covers how to connect one, in order of how much control you need.

Everything below is about **text** generation (chat, character/bot replies,
one-shot generation). Art/image servers (ComfyUI, A1111) are a separate
system — see `docs/self-hosted-media.md` for those.

## How server selection works

- Every user has an optional `preferredTextServerId`. When set, it is the
  default text server for every chat surface (character chat, bot chat,
  reward encounters, etc.) — set it once and it applies everywhere.
- With nothing selected, generation falls back to Kind Robots' own cloud
  route (shown in the UI as "Platform text route").
- The active server for the current session is shown directly in the chat
  UI (a "Text Server" / "Active Text Server" tile), so which provider is
  about to answer is never a hidden request parameter.
- Text-capable server types are `OPENAI`, `ANTHROPIC`, `OLLAMA`, and
  `CUSTOM` (an OpenAI-compatible endpoint — see below). Art-only types
  (`A1111`, `COMFY`) never appear in a text server picker.

## Option 1 — quick setup (Ollama only)

The fastest path, reachable from the server icon in the main navigation
("Server Connections"):

1. Open **Server Connections** → **Add Local** under the Connections
   section.
2. Pick **Ollama** as the server type, give it a label, and enter its base
   URL (see "Network reachability" below — `http://127.0.0.1:11434` only
   works if that address is reachable from the Kind Robots server itself,
   not just your own browser).
3. Save, then pick it from the **Default Text** dropdown at the top of the
   same dialog and **Save Defaults**.

This quick-add flow only supports Ollama (no auth) today. To connect an
OpenAI-compatible endpoint that needs a bearer key or a custom header, use
the full form below.

## Option 2 — OpenAI-compatible private endpoint (full setup)

Use this for anything that speaks the OpenAI `/v1/chat/completions` wire
format — a local vLLM/llama.cpp/text-generation-webui server, a hosted
OpenAI-compatible provider, etc. — including ones that need an API key.

1. Go to the **Servers** page (`/servers`) and use the **Add Server** form.
2. Fill in:
   - **Server Type**: `CUSTOM`
   - **Access Mode**: `TAILSCALE` for a Tailscale-reachable box, `LOCAL` for
     same-host/LAN, `BACKEND` if it's a proxied cloud endpoint
   - **Base URL**: the server's root (e.g.
     `https://your-box.your-tailnet.ts.net`)
   - **Endpoint Path**: usually `/v1/chat/completions`
   - **Health Path**: usually `/v1/models` (or whatever your server exposes
     for a lightweight liveness check)
   - **Category**: `text`
3. If the endpoint requires a key, set **Auth Type** to `BEARER` (or
   `HEADER`/`API_KEY` with the matching **API Key Header Name**) and paste
   the key into **API Key**. The key is stored server-side only — it is
   never sent back to the browser; the client only ever sees the redacted
   server record.
4. Save, then set it as your **Default Text** server from the Server
   Connections dialog (or per-bot, for a Bot's own dedicated server).

Ollama can also be added this way (`Server Type: OLLAMA`) if you need
options the quick-add flow doesn't expose (custom endpoint/health paths, a
non-default port, etc.) — the form pre-fills Ollama's usual
`http://127.0.0.1:11434` + `/api/chat` defaults when you pick that type.

## Network reachability

Text generation always runs through the Kind Robots backend — the server
you configure is dialed by the application's own server process, never
directly from a user's browser. That means:

- `http://127.0.0.1:...` or `http://localhost:...` only resolves to
  _your own machine_ from a browser's perspective; from the backend
  container it resolves to the container itself, not your workstation. It
  only works if the text server runs in that same container/host.
- The base URL needs to be reachable from wherever Kind Robots' backend
  actually runs (its self-hosted production container, or your local dev
  server). A Tailscale hostname (as in the add-server form's own
  placeholder) is the recommended pattern for a private box that isn't on
  the same host or LAN as the deployment — it gives the backend a stable,
  authenticated path to the box without exposing it publicly.
- A server on the same LAN as the deployment can use its LAN IP directly;
  confirm the deployment host can actually route to that subnet.
- Use each server's **Health Path** (`Test`/health-check action on its
  card) to confirm reachability from the backend before relying on it for
  a real chat — a server that looks fine from your own browser can still
  be unreachable from the backend if it's on a different network.

## Credentials

Provider API keys (OpenAI, Anthropic, or a private `CUSTOM` endpoint's key)
are stored server-side only and read directly by the generation routes.
Client code only ever receives the redacted server record (whether a key
_is_ saved, never its value) — this is true whether the key came from the
quick "Save" forms for OpenAI/Anthropic or the full Servers form's **Auth**
section.
