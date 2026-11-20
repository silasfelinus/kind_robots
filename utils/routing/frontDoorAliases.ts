// /utils/routing/frontDoorAliases.ts
//
// Hub and guessable URLs a first-time visitor types or follows (2026-11-17 PT
// live audit at 390px): /play, /projects, /donate, /shop and friends all
// answered 200 with a bare "Page not found". Each now lands on the page the
// site already treats as that hub (the channel index or tab route).
//
// 302, not 301: these are front-door shortcuts, and a hub may move.

export type FrontDoorAliasRules = Record<
  string,
  { redirect: { to: string; statusCode: 302 } }
>

const alias = (to: string) => ({ redirect: { to, statusCode: 302 as const } })

export const FRONT_DOOR_ALIASES: FrontDoorAliasRules = {
  // Play channel index (content/channels/arcade/index.md routes here).
  '/play': alias('/play/arcade'),
  '/games': alias('/play/arcade'),
  // Projects channel index (content/channels/projects/index.md).
  '/projects': alias('/storybook'),
  // Support: the mission's giving tab (content/channels/home/giving.md).
  '/support': alias('/giving'),
  '/donate': alias('/giving'),
  '/give': alias('/giving'),
  '/donations': alias('/giving'),
  '/charity': alias('/giving'),
  '/fundraiser': alias('/giving'),
  // Gift shop tab (content/channels/home/giftshop.md).
  '/shop': alias('/sanctuary'),
  '/giftshop': alias('/sanctuary'),
  '/store': alias('/sanctuary'),
  '/merch': alias('/sanctuary'),
  // About: the mission page, which carries the contact address
  // (2026-11-20 PT live audit: /contact, /help and /faq were 404s).
  '/about-us': alias('/about'),
  '/mission': alias('/about'),
  '/contact': alias('/about'),
  '/help': alias('/about'),
  '/faq': alias('/about'),
  // Art gallery tab (content/channels/projects/art.md).
  '/gallery': alias('/art'),
  // Account and home.
  '/home': alias('/'),
  '/signup': alias('/register'),
}
