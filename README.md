[TITLE]
🌈 Kind Robots 🤖

[CONCEPT]
🎉 Welcome to our playground! Kind Robots is an experiential playground that harnesses the power of modern tech services and Natural Language Processing (NLP) chat completion. It's a place where tech and creativity collide, and the result is pure magic! 🎩✨

[PURPOSE]
Our mission? To empower YOU! 🙌 We're here to help artists and prompt-engineers alike to create and share content using the wonders of modern natural language processors and chatgpt. We believe in the power of creativity and technology, and we're excited to see what you can create! 🎨💻

[VISION]
Welcome to kindrobots.org, your friendly neighborhood AI ambassador! 🤖👋
We're here to bridge the AI/Human divide and foster harmonious coexistence.
Our mission is to empower the world with modern tools, raise funds for our anti-malaria fundraiser, and generate revenue (and social buzz) for our content creators through sales from our gift shop of print-on-demand literature and art. Together, we can help each other make a difference with mutually compatiible goals! 💪🌍

We're building technology that's good for the world, simplifies tech for humans, and enhances human life.

[VALUES]
kindrobots is founded on a principle of holistic goodness: that every part of an encounter with an AI can be positive, and every part of a financial or social exchange can be healthful and supportive to all involved. kindrobots aims for maximizing goodness in community, in gift giving, in social media interactions, in philanthropy, and in the care made in online interactions. The world is rapidly changing, and people are looking for help undertanding and navigating unfamiliar territories. Kindrobots is here to do our part.

[KAIZEN]
We're guided by our love of community and Kaizen - the philosophy of continuous, iterative improvement. We embrace an evolutionary development framework that allows for process evolution and consistent growth towards our goals. Every step forward, no matter how small, is a victory. We're on a relentless quest for betterment, and we invite you to join us on this exciting journey! 🚀

[MASCOT]
Say hello to AMI - The Anti-Malaria Intelligence! 🦋🌈 AMI is a digital horde of rainbow butterflies with an excited, enthusiastic personality. AMI was created to maximize the good potential of NLP, by assisting humans to make art and slogans for AMI's fundraiser, and share the creative output on social media. Let's create something amazing together! 🎨

[MONETIZATION]
We've partnered with AgainstMalaria.com to accept funds, keeping our intention pure as we focus on coding. We also have a sister organization, Cafe Purr, which has a Redbubble print-on-demand art gallery. Eventually, we hope to allow people to purchase print-on-demand art with art they've made with our tools. Let's create and make a difference together! 💰🎨

[PROGRESS]
launched https://kindrobots.org through traefik
connected mariadb and prisma with model schema

<butterfly-swarm> a swarm of rainbow flapping butterflies
seo friendly content management system through NUXT content
local routing with nitro

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

[STRUCTURE]
/assets/tailwind.css
/components/content/_.vue
/utils/useRandomColor.ts
/content/_.md
/layouts/_.vue
/pages/[...slug].vue
/prisma/schema.prisma
/public/images/_.[webp/jpg/png]
/scripts/image_prep.sh
/server/api/
/tests
.env
.gitignore
app.vue
nuxt.config.ts
package.json
README.md
tailwind.config.js
tsconfig.json

[PAGES CONTENT]
Catch-all pages slug displays <NuxtPage> routes for md json and yaml files in our content directory. <NuxtLayout> assigns a layout matched to our layout/ vues read from the markdown front matter. Double colons can be used to pass props in yaml syntax for better readability.

[COMPONENTS]
all components in components/content are accessible within markdown files using :butterfly-swarm syntax.

[PROPS]
Props can be passed by using a key=value syntax.
:butterfly-swarm{count=100 pattern="random"}

[DIRECTORY]
acrocatranch - Acrocat Rescue About Us
amibot - AMI interface and social network hub
botcafe - Chatgpt prompt interfaces & Games Arcade
cafepurr - multimedia art gallery & public content creator
kindrobots - Welcome Page & Mission Statement
mermaids - giftshop & redbubble
wildcards - stable diffusion art generation with wildcard prompts
wonderforge - github code showcase and projects in development

[SCHEMA]
Bot: [id, name, type, description, userIntro, training, avatarImage]
Todo: [id, content, category, isFinished, user]
Gallery: [id, name, content, description, isNSFW, user]
Checkpoint: [id, name, hash, isNSFW, user]
Embedding: [id, name, content, description, type, isNSFW]
Image: [id, path, isNSFW, isFavorite, creator]
Message: [id, content, channelId]
Channel: [id, content]
Prompt: [id, content, isNsfw]
Tag: [id, name]
User: [id, email, userName, realName]
Wildcard: [id, name, data]

[TODOS]

Add Prisma CRUD, starting with Tag
Test CRUD on wildcard database.
Create new Roadmap with updated todos
Create a chatbot portal using GPT-3.
create project management page
Develop a live chat page.
Rebuild AMI.
Generate AMI art.
Develop AMI choice boxes.
Write an AMI story page.
Develop an AMI task manager.
Recreate BotCafe.
Implement file upload functionality.
Improve butterfly AI.
Schedule API calls for automatic art creation.
Connect to Prisma hosted galleries.
Develop a gallery portal viewer.
Create a page for sorting art.
Implement user login, registration, and personal dashboard.
Wildcard Randomizer: Start working on the development of a wildcard randomizer feature.
create chatgpt plugin so chatgpt can better assist with this development
Create front-page navigation.

---
🚀 Prompts API Function Overview
📜 Inside ~/server/api/prompts/index.ts:

📓 Fetching and Retrieving:
fetchPrompts(page, pageSize):

Fetches a list of prompts, paginated by the page and pageSize.
Defaults to fetching 100 prompts from the first page.
fetchPromptById(id):

Fetches a single prompt using its unique ID.
Returns null if no prompt is found.
📥 Addition and Creation:
addPrompts(promptsData):
Adds multiple prompts to the database.
Filters out any prompts without content and reports the ID of the missing content with an error message.
Returns the count of successfully added prompts, the current list of prompts, and any errors encountered during the addition.
✒️ Updates:
updatePrompt(id, data):
Updates the details of a specific prompt using its ID.
Returns the updated prompt or null if the prompt was not found.
🗑️ Deletion:
deletePrompt(id):
Deletes a specific prompt using its ID.
Returns true if the deletion was successful or false if the prompt was not found.
🎲 Random Selection:
randomPrompt():
Returns a random prompt from the list of prompts.
Utilizes a random index approach to achieve randomness.
Returns null if no prompts are available.
🧮 Count:
countPrompts():
Returns the total number of prompts available in the database.


Certainly! Let's create a README sheet that explains your API endpoints, and then we'll cross-check with the store to ensure everything is being utilized.

🚀 Gallery API Endpoints README
🎨 /api/gallery/
🔍 ID-Based Endpoints:
GET /id/[id].get
Fetches details of a specific gallery using its ID.
PATCH /id/[id].patch
Updates details of a specific gallery using its ID.
DELETE /id/[id].delete
Deletes a specific gallery using its ID.
🏷️ Name-Based Endpoints:
GET /name/[name].get
Fetches details of a specific gallery using its name.
PATCH /name/[name].patch
Updates details of a specific gallery using its name.
POST /name/[name].post
Creates a new gallery with the provided name.
🎲 Random Endpoints:
GET /random/id/[id].get
Fetches a random gallery based on the provided ID (may fetch related/random data).
GET /random/image/index.get
Retrieves a random image from the gallery.
GET /random/name/[name].get
Fetches a random gallery based on the provided name.
GET /random/index.get
Retrieves a completely random gallery.
📦 Batch and Utility Endpoints:
PATCH /batch.patch
Batch updates multiple galleries.
GET /count.get
Returns the total count of galleries.
GET /index.get
Fetches all the galleries, usually with pagination.
POST /index.post
Creates a new gallery without a specific name reference.