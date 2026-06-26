---

"There are other techniques...for further tuning the AI output to be more helpful, honest, and harmless"

- Andrew NG
  "Oppportunities in AI - 2023"

# Kind Robots

**A socially conscious, server-agnostic suite of AI-supported creativity tools.**

Kind Robots helps people build imaginative worlds with AI — and turns that creativity into good in the world. The project began life as *Save One Human*, an anti-malaria fundraiser, and that mission still sits at its heart: a share of everything Kind Robots earns is destined for our malaria fundraiser at **[againstmalaria.com/amibot](https://againstmalaria.com/amibot)**.

It's built with **Nuxt 4**, **Vue 3**, **TypeScript**, **Prisma**, **Pinia 3**, **DaisyUI**, and **TailwindCSS**.

### 🚀 Try it now: **[kind-robots.vercel.app](https://kind-robots.vercel.app)**

No install required — the full site is live. Just sign in with email or Google and start dreaming. Cloning this repo is only needed if you want to **self-host your own instance** (see [Self-Hosting](#self-hosting) below).

> ⚠️ **Active development.** Kind Robots is built and maintained by a single developer/designer. Architecture and APIs change frequently. Some features described below are live, some are partially wired, and some are on the roadmap — these are labeled accordingly.

---

## Meet Ami

**Ami** — the *Anti-Malaria Intelligence* — is the heart of the project. Ami sometimes appears as a friendly woman, but she is really a nonbinary hivemind of digital rainbow butterflies, created to fight malaria. Ami hosts the experience, guides creation, and keeps the mission front and center.

---

## The Core Idea: Dreams

Everything in Kind Robots starts with a **Dream** (the central model; a Dream is sometimes referred to as a *Pitch*). A Dream is a seed of an idea — it can be as specific or as broad as you like. From that seed, Kind Robots helps you grow a whole world of interconnected, AI-generated assets:

- **Narrators** — a unique storyteller for your world, each with their own voice and a set of ~20 generated expressions.
- **Pitch Sheets** — a structured summary of your world's premise.
- **Art** — generated imagery for your world.
- **Characters** — chattable personas you can talk with directly.
- **Rewards** — in-world items.
- **Locations** — specialized Dreams representing places in your world.
- **Scenarios** — story hooks that inspire new stories in your Narrator's unique voice, or open paths to generate more art.

Each generated asset can connect back to others, so a Dream becomes a living, explorable world rather than a single output.

---

## What Else You Can Do

- **Art Generator** — create images using your choice of AI backend.
- **Memory Match Game** — a card-matching game played with generated art.
- **Stage Manager** — a synthetic chat room where your Characters talk to one another.
- **Jellybean Achievements** — hidden achievements to discover as you explore.
- **Themes** — 36+ DaisyUI themes (and more) that you can customize and share.
- **Reviews** — a community review system.
- **Friends & Chat** — a user friend system and direct chat.
- **Forums** — community discussion spaces.

---

## Self-Hosting

**Most people don't need this section** — the full experience is live at **[kind-robots.vercel.app](https://kind-robots.vercel.app)**. Follow the steps below only if you want to run your own independent instance.

### Prerequisites

- Node.js (current LTS recommended)
- A MySQL database
- An account — **you must log in with email or Google to use generation services.**

### Install

```bash
git clone https://github.com/silasfelinus/kind_robots.git
cd kind_robots
npm install
```

### Configure your environment

Create a `.env` file in the project root. At minimum you'll need a database connection string; add AI provider keys depending on which backends you want to enable (see below).

```env
DATABASE_URL="mysql://user:password@host:3306/kindrobots"
# AI providers (optional — configure the ones you want)
# OPENAI_API_KEY="..."
# ANTHROPIC_API_KEY="..."
```

> Never commit `.env` or real keys to version control.

### Set up the database

```bash
npx prisma migrate dev
npx prisma generate
```

### Run

```bash
npm run dev
```

---

## Configuring AI Backends

Kind Robots is **server-agnostic** by design: you choose where generation happens. There are three paths.

### 1. Bring your own cloud key (OpenAI or Claude)

Add your provider key to the server environment:

```env
OPENAI_API_KEY="sk-..."        # OpenAI
ANTHROPIC_API_KEY="sk-ant-..." # Claude (Anthropic)
```

With your own key configured, generation runs against your account with your provider.

### 2. Bring your own local server (Stable Diffusion / ComfyUI)

Point Kind Robots at a private endpoint — for example a self-hosted **Stable Diffusion WebUI** or **ComfyUI** instance reachable over your own network (a **Tailscale** URL works well for this). This keeps generation entirely on hardware you control.

### 3. Use our default services (metered tokens)

Don't want to configure anything? Use the built-in default services. These run on a **metered token system**: you get a free balance of tokens that **replenishes daily**, spent as you generate.

> **Logging in is required** for all generation services, via email or Google.

---

## The Token & Revenue Model

**Today:** Generation on our default services uses **free, daily-replenishing tokens**. There is no paid tier yet.

**Planned:** Paid tokens are not yet implemented. When they arrive, the goal is a **revenue-share model**, with profit split three ways:

- **⅓ to Kind Robots** — to sustain and develop the platform.
- **⅓ to contributors** — referrers, and the creators of assets that get interacted with.
- **⅓ to the malaria fundraiser** — at [againstmalaria.com/amibot](https://againstmalaria.com/amibot).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 / Vue 3 |
| Language | TypeScript |
| State | Pinia 3 |
| ORM / DB | Prisma + MySQL |
| Styling | TailwindCSS + DaisyUI |
| Content | Nuxt Content |
| AI backends | OpenAI, Anthropic (Claude), Stable Diffusion / ComfyUI (self-hosted) |

**Architectural principles:** schema-as-truth, store-as-truth, the server owns authentication and authorization, and the frontend owns composition and UX gating. Each concern has a single owner.

---

## Roadmap

These are goals, not current features:

- **Paid tokens & revenue share** — implement the three-way split described above.
- **Return to nonprofit status** — targeted for 2027.
- **Solar-powered hosting** — moving the self-hosted server and database onto solar, tied to a planned house upgrade.

---

## The Mission

Kind Robots exists to encourage creativity with AI tools — and to turn that creativity into benefit for humanity. The clearest expression of that is our anti-malaria fundraiser, carried forward from its origins as *Save One Human*:

### → [againstmalaria.com/amibot](https://againstmalaria.com/amibot)

---

## License & Contributing

This is an actively evolving solo project. If you'd like to get involved, open an issue to start a conversation.


[Commands]
Install files:
npm install

Launch prisma studio:
npx prisma studio

Run lint and prettier:
npx run lint

Install files:
npm install

Start dev server:
npx run dev

Start Production Build:
npx run build
npx run start

Setup Database:
npx prisma studio
npx prisma db pull
npx prisma migrate dev

Update Database:
npx prisma migrate dev --name [NAME]
npx prisma generate


Run Typescript tests:
npm run test

Run cypress Tests:
 npm run cypress:run

 Run Single Cypress Test:
npx cypress run --spec "cypress/e2e/api/users.cy.ts"

Update Smart Icons
node utils/scripts/updateKindIcons.js

Run comfy-test
curl -X POST "https://kind-robots.vercel.app/prompt" \
  -H "Content-Type: application/json" \
  --data-binary @utils/fluxKontext.json

******
Database migration fix! [replace UPDATE_NAME]

# 1) Create SQL from live DB vs schema (no shadow)
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel   prisma/schema.prisma \
  --script > migration.sql

# 2) Apply it to the DB (reads .env via --schema)
npx prisma db execute --file migration.sql --schema prisma/schema.prisma

# 3) Record it as a proper migration folder
TS=$(date +%Y%m%d%H%M%S); MIGR="${TS}_chattype_and_pitchtype"
mkdir -p prisma/migrations/"$MIGR"
mv migration.sql prisma/migrations/"$MIGR"/migration.sql
npx prisma migrate resolve --schema=prisma/schema.prisma --applied "$MIGR"

# 4) Regenerate + sanity check
npx prisma generate
npx prisma migrate status --schema=prisma/schema.prisma

**********
Covnert Images: 
node ./utils/scripts/convertImagesToWebp.mjs public/images/convert public/images/convert/webp
