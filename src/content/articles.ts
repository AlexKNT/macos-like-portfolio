import type { Article } from '#content/types'

/**
 * The posts the articles window links out to. Each date is ISO, so the window decides
 * how to format it, and each link is absolute and leaves the app.
 */
export const ARTICLES: readonly Article[] = [
  {
    id: 'typescript-explained',
    title: 'TypeScript Explained: What It Is, Why It Matters, and How to Master It',
    date: '2025-09-02',
    image: {
      imageUrl: '/images/blog1.png',
      alt: 'Cover image for the article TypeScript Explained',
    },
    href: 'https://jsmastery.com/blog/typescript-explained-what-it-is-why-it-matters-and-how-to-master-it',
  },
  {
    id: 'three-js-guide',
    title: 'The Ultimate Guide to Mastering Three.js for 3D Development',
    date: '2025-08-28',
    image: {
      imageUrl: '/images/blog2.png',
      alt: 'Cover image for the guide to mastering Three.js',
    },
    href: 'https://jsmastery.com/blog/the-ultimate-guide-to-mastering-three-js-for-3d-development',
  },
  {
    id: 'gsap-animations',
    title: 'The Ultimate Guide to Mastering GSAP Animations',
    date: '2025-08-15',
    image: {
      imageUrl: '/images/blog3.png',
      alt: 'Cover image for the guide to mastering GSAP animations',
    },
    href: 'https://jsmastery.com/blog/the-ultimate-guide-to-mastering-gsap-animations',
  },
]
