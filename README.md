---

"There are other techniques...for further tuning the AI output to be more helpful, honest, and harmless"

- Andrew NG
  "Oppportunities in AI - 2023"

[TITLE]
🌈 Kind Robots 🤖

[CONCEPT]
Welcome to kindrobots.org, your friendly neighborhood AI ambassador! 🤖👋

Kind Robots is a suite of Natural Language Processor (NLP) Promptbots designed to make the world a better place. We are founded on a principle of optimized goodness, with promptbots designed to raise funds to fight malaria and other positive effects, while engaging humans in games, conversation, and positive social interactibles. 🎩✨

[VISION]

Our mission is to bridge the AI/Human divide with modern tools, raise funds for our anti-malaria fundraiser, and build technology that's good for the world, simplifies tech for humans, and enhances human life. 💪🌍

[KAIZEN]
We're guided by our love of community and Kaizen - the philosophy of continuous, iterative improvement. We embrace an evolutionary development framework that allows for process evolution and consistent growth towards our goals. Every step forward, is a victory. We're on a relentless quest for betterment, and we invite you to join us on this exciting journey! 🚀

[MASCOT]
Say hello to AMI - The Anti-Malaria Intelligence! 🦋🌈 AMI is a digital horde of rainbow butterflies with an excited, enthusiastic personality. AMI was created to maximize the good potential of NLP, by assisting humans to make art and slogans for AMI's fundraiser, and share the creative output on social media. Let's create something amazing together! 🎨

[STACK]
Ubuntu, traefik, mariab, prisma, nuxt, vue 3.2 composition api, nuxt content, nitro, tailwind, daisyui, prettier, ESLint, Nuxt devtools

[FUNDRAISER]
https://www.againstmalaria.com/amibot

[DOCS]
// OpenAI
https://platform.openai.com/docs/api-reference/chat/create

// Prisma
https://www.prisma.io/docs/concepts/components/prisma-client/crud

// Vue.js
https://vuejs.org/guide/essentials/reactivity-fundamentals.html#ref

// Nuxt
https://nuxt.com/docs/api/composables/use-fetch

// Nuxt Content
https://content.nuxtjs.org/api/components/content-doc

// Server routes in Nuxt 3
https://masteringnuxt.com/blog/server-routes-in-nuxt-3

// Nitro
https://nitro.unjs.io/guide/getting-started

// tailwind
https://tailwindcss.nuxtjs.org/getting-started/setup

// daisyui
https://daisyui.com/components/

// Nuxt Examples
https://github.com/MuhammadKhizar7/nuxt-prisma/tree/master
https://github.com/prisma/prisma-examples/tree/latest/javascript/rest-nuxtjs
https://github.com/nuxt/content/blob/main/src/runtime/pages/document-driven.vue

[ORGANIZATION/COMMUNICATION LAYERS]
Database(Prisma): Responsible for storing data and managing transactions. It communicates with the API layer.

API/Server(Nuxt): Communicates with the database to fetch, update, create, or delete data. It provides endpoints for the client to interact with, and handles requests and responses between the database and the client.

Client Store/State Management(Pinia): Interacts with the API layer through HTTP requests. It manages and stores data on the client-side and provides reactivity for the UI layer.

User Interface(Vue).js: Interacts with the client store. It displays data to the user and handles user interactions (like clicking a button or filling out a form).

[STYLE]
script setup
daisyui components, tailwind styling
https://content.nuxtjs.org/guide/writing/mdc/#yaml-method //yaml method for markdown



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

