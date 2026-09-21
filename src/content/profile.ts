import type { Profile, Social } from '#content/types'

/**
 * The profile the About window and the contact window read: name, role, bio, avatar
 * and address in one place, so none of them is repeated across the content.
 *
 * `availability` is deliberately unset here: the contact window shows that line only when this
 * profile carries one, so leaving it out is a state the window is built for, not a gap.
 * Spec 0008, AC-9, AC-14.
 */
export const PROFILE: Profile = {
  id: 'profile',
  name: 'Adrian',
  role: 'Web Developer',
  tagline: 'Fast, clear interfaces, built to feel effortless.',
  greeting: {
    lead: 'Hey, welcome to my',
    display: 'portfolio',
  },
  bio: [
    "Hey! I'm Adrian, a web developer who enjoys building sleek, interactive websites that actually work well.",
    'I specialize in JavaScript, React, and Next.js, and I love making things feel smooth, fast, and just a little bit delightful.',
    "I'm big on clean UI, good UX, and writing code that doesn't need a search party to debug.",
    "Outside of dev work you'll find me tweaking layouts at 2AM, sipping overpriced coffee, or buying gadgets I had convinced myself I needed.",
  ],
  email: 'adrian@example.com',
  avatar: {
    imageUrl: '/images/adrian.jpg',
    alt: 'Portrait of Adrian, the developer behind this portfolio',
  },
}

/** The social links the contact window shows, each with the brand colour of its tile. */
export const SOCIALS: readonly Social[] = [
  {
    id: 'github',
    label: 'GitHub',
    icon: '/icons/github.svg',
    color: '#f4656b',
    href: 'https://github.com/JavaScript-Mastery-Pro',
  },
  {
    id: 'site',
    label: 'Website',
    icon: '/icons/atom.svg',
    color: '#4bcb63',
    href: 'https://jsmastery.com/',
  },
  {
    id: 'twitter',
    label: 'Twitter/X',
    icon: '/icons/twitter.svg',
    color: '#ff866b',
    href: 'https://x.com/jsmasterypro',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: '/icons/linkedin.svg',
    color: '#05b6f6',
    href: 'https://www.linkedin.com/company/javascriptmastery/posts/?feedView=all',
  },
]
