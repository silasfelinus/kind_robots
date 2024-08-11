---

"There are other techniques...for further tuning the AI output to be more helpful, honest, and harmless" 
- Andrew NG 
"Oppportunities in AI - 2023"

[TITLE]
🌈 Kind Robots 🤖

[CONCEPT]
Welcome to kindrobots.org, your friendly neighborhood AI ambassador! 🤖👋

Kind Robots is a suite of Natural Language Processor (NLP) Promptbots designed to make the world a better place. We are founded on a principle of optimized goodness, with promptbots designed to raise funds to fight malaria and other positive effects, while engaging humans in games, conversation, and positive social interactibles.  🎩✨


[VISION]

Our mission is to bridge the AI/Human divide with modern tools, raise funds for our anti-malaria fundraiser, and  build technology that's good for the world, simplifies tech for humans, and enhances human life.  💪🌍

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




[DIRECTORY - Outdated]
acrocatranch - Acrocat Rescue About Us
amibot - AMI interface and social network hub
botcafe - Chatgpt prompt interfaces & Games Arcade
cafepurr - multimedia art gallery & public content creator
kindrobots - Welcome Page & Mission Statement
mermaids - giftshop & redbubble
wildcards - stable diffusion art generation with wildcard prompts
wonderforge - github code showcase and projects in development

[SCHEMA]
Art: [id, galleryId, path, prompt, artPromptId, userId, pitchId, createdAt, updatedAt, boos, claps, cfg, checkpoint, sampler, seed, steps, pitch, channelId, isOrphan, isPublic, isMature, designer, ArtReaction]
ArtPrompt: [id, createdAt, updatedAt, userId, prompt, galleryId, pitch, pitchId, DB_ROW_HASH_1]
ArtReaction: [id, createdAt, updatedAt, userId, artId, claps, boos, title, comment, reaction, pitchId, Art, Pitch, User]
Bot: [id, createdAt, updatedAt, BotType, name, isPublic, underConstruction, canDelete, subtitle, description, avatarImage, botIntro, userIntro, prompt, trainingPath, theme, personality, modules, userId, sampleResponse, tagline, Slogan]
Channel: [id, createdAt, updatedAt, userId, label, description, tagId, title, pitchId]
ChatExchange: [id, createdAt, updatedAt, botId, botName, userId, username, userPrompt, botResponse, liked, hated, loved, flagged, previousEntryId]
Gallery: [id, createdAt, updatedAt, name, description, mediaId, url, custodian, userId, content, highlightImage, imagePaths, isMature]
Game: [id, createdAt, updatedAt, content, category, isFinished, userId, reward, icon, points, isPrivate, User]
Log: [id, message, timestamp, username]
Message: [id, createdAt, updatedAt, sender, recipient, content, channelId, botId, userId]
Milestone: [id, label, message, icon, karma, isRepeatable, createdAt, updatedAt, triggerCode, tooltip, isActive, pageHint, subtleHint]
MilestoneRecord: [id, createdAt, updatedAt, milestoneId, userId, username]
Pitch: [id, createdAt, updatedAt, title, pitch, userId, isPublic, claps, boos, channelId, designer, flavorText, isOrphan, creatorId, highlightImage, isMature, ArtReaction]
Cart: [id, createdAt, updatedAt, customerId, Customer, items]
CartItem: [id, cartId, productId, quantity, Cart, Product]
Customer: [id, createdAt, updatedAt, email, name, userId, Carts, User]
RandomList: [id, title, items, userId]
Post: [id, createdAt, updatedAt, userId, username, content, title, label, imagePath, artId, pitchId, pitchname, sloganContent, sloganId, botId, botname, channelId, likes, dislikes, hates, loves, jellybeanClaps, isFavorite]
Product: [id, createdAt, updatedAt, title, category, flavorText, description, costInPennies, userId, passcode, imagePath, CartItem]
Resource: [id, createdAt, updatedAt, userId, name, customLabel, MediaPath, customUrl, civitaiUrl, huggingUrl, localPath, description, resourceType, isMature, galleryCount]
Reward: [id, createdAt, updatedAt, icon, text, power, collection, rarity, label, Todo]
Slogan: [id, contentType, purpose, url, characterLimit, content, likes, dislikes, hates, loves, isLiked, isLoved, wasKept, wasDiscarded, username, userId, model, kindRobot, botId, createdAt, updatedAt, Bot, User]
Tag: [id, createdAt, updatedAt, label, title, userId, isPublic, channelId, flavorText, pitch, isMature, sloganId, postId]
Todo: [id, task, category, completed, createdAt, userId, rewardId, updatedAt, Reward, User]
User: [id, createdAt, updatedAt, Role, username, email, questPoints, emailVerified, name, address1, address2, avatarImage, bio, birthday, city, country, discordUrl, facebookUrl, instagramUrl, kindrobotsUrl, languages, phone, state, timezone, twitterUrl, apiKey, password, spotifyAccessToken, spotifyID, spotifyRefreshToken, karma, mana, clickRecord, matchRecord, ArtReaction, Customer, Game, Slogan, Todo]

ArtReactionToTag: [A, B]
ArtToProduct: [A, B]
ArtToTag: [A, B]
MilestoneToUser: [A, B]
RewardToUser: [A, B]

Enums:
Role: [SYSTEM, USER, ASSISTANT, ADMIN, GUEST, BOT, DESIGNER, CHILD]
ResourceType: [CHECKPOINT, EMBEDDING, LORA, LYCORIS, HYPERNETWORK, CONTROLNET, URL, API]


[TODOS]

Fix database corruption errors in prisma
milestone records are no longer in proper datetime format
add navigation button accessible in mobile
clean up / rebuild home page on mobile
art datetime corruption fixed/removed
easier to see loading icon
art modeller doesn't generate
fix workshop directory searching by letter instead of full name
LINT DIRECTORY NOT FOUND
lint errors fixed
brainstorm not loading second brainstorm

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
npx prisma db pull
npx prisma migrate dev

Update Database:
npx prisma migrate dev --[name]
npx prisma generate