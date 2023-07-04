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

[ORGANIZATION]
Acrocat Ranch (About Us)- Our parent organization. Home of the Knight family and Acrocat Foster Kitten Rescue, located among the redwoods on the Pacific Northcoast. about Us
Cafe Purr (Giftshop) - Curated digital art gallery and Non-Evil Art Museum.
Kind Robots (tech gallery)- Friendly tech for humans

[STYLE]
script setup
daisyui components, tailwind styling
https://content.nuxtjs.org/guide/writing/mdc/#yaml-method //yaml method for markdown

[STRUCTURE]
/assets/tailwind.css
/components/content/_.vue
/composables/useRandomColor.ts
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
Bot: [id, name, type, description, intro, training, avatarImage]
Todo: [id, content, category, isFinished, user]
Gallery: [id, name, content, description, isNSFW, isAuth, user]
Checkpoint: [id, name, hash, isNSFW, user]
Embedding: [id, name, content, description, type, isNSFW]
Image: [id, path, isNSFW, isFavorite, creator]
Message: [id, content, conversationId]
Conversation: [id, content]
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
