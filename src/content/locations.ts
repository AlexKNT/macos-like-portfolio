import { PROFILE } from '#content/profile'
import type { Location, LocationId } from '#content/types'

/**
 * The four Finder locations. Each key has an entry, each entry takes its key as its id,
 * and a location shows itself through the projects window, so it names no window of its own.
 *
 * The About text file takes its paragraphs from `PROFILE.bio` rather than holding a second
 * copy of them. Spec 0001, AC-9.
 */
export const LOCATIONS: Record<LocationId, Location> = {
  work: {
    id: 'work',
    name: 'Work',
    icon: '/icons/work.svg',
    children: [
      {
        id: 'nike-ecommerce',
        kind: 'folder',
        name: 'Nike Ecommerce Website Application',
        icon: '/images/folder.png',
        position: 'top-10 left-5',
        windowPosition: 'top-[5vh] left-5',
        children: [
          {
            id: 'nike-about',
            kind: 'text',
            name: 'Nike Project.txt',
            icon: '/images/txt.png',
            position: 'top-5 left-10',
            description: [
              'The Nike eCommerce website is a sleek and modern platform designed for shopping the latest Nike collections.',
              'Instead of a simple online store, it delivers an immersive experience with bold visuals, interactive product displays, and smooth navigation.',
              'Think of it like walking into a flagship Nike store, but right from your phone or laptop.',
              "It's built with Next.js and Tailwind, ensuring fast performance, responsive design, and a clean, premium look.",
            ],
          },
          {
            id: 'nike-live',
            kind: 'link',
            name: 'nike.com',
            icon: '/images/safari.png',
            position: 'top-10 right-20',
            href: 'https://youtu.be/fZdTYswuZjU?si=Awjl-pIst9e09_UU',
          },
          {
            id: 'nike-screenshot',
            kind: 'image',
            name: 'nike.png',
            icon: '/images/image.png',
            position: 'top-52 right-80',
            imageUrl: '/images/project-1.png',
            alt: 'Screenshot of the Nike ecommerce storefront',
          },
        ],
      },
      {
        id: 'ai-resume-analyzer',
        kind: 'folder',
        name: 'AI Resume Analyzer',
        icon: '/images/folder.png',
        position: 'top-52 right-80',
        windowPosition: 'top-[20vh] left-7',
        children: [
          {
            id: 'ai-resume-about',
            kind: 'text',
            name: 'AI Resume Analyzer Project.txt',
            icon: '/images/txt.png',
            position: 'top-5 right-10',
            description: [
              'AI Resume Analyzer is a smart tool that helps you perfect your resume with instant feedback.',
              'Instead of guessing what recruiters want, you get AI powered insights on keywords, formatting, and overall impact.',
              'Think of it like having a career coach that points out strengths, fixes weaknesses, and boosts your chances of landing interviews.',
              "It's built with Next.js and Tailwind, so it runs fast, looks professional, and works seamlessly on any device.",
            ],
          },
          {
            id: 'ai-resume-live',
            kind: 'link',
            name: 'ai-resume-analyzer.com',
            icon: '/images/safari.png',
            position: 'top-20 left-20',
            href: 'https://youtu.be/iYOz165wGkQ?si=R1hs8Legl200m0Cl',
          },
          {
            id: 'ai-resume-screenshot',
            kind: 'image',
            name: 'ai-resume-analyzer.png',
            icon: '/images/image.png',
            position: 'top-52 left-80',
            imageUrl: '/images/project-2.png',
            alt: 'Screenshot of the AI Resume Analyzer reviewing a resume',
          },
        ],
      },
      {
        id: 'food-delivery-app',
        kind: 'folder',
        name: 'Food Delivery App',
        icon: '/images/folder.png',
        position: 'top-10 left-80',
        windowPosition: 'top-[33vh] left-7',
        children: [
          {
            id: 'food-delivery-about',
            kind: 'text',
            name: 'Food Delivery App Project.txt',
            icon: '/images/txt.png',
            position: 'top-5 left-10',
            description: [
              'Our Food Delivery App is a fast and convenient way to order meals from your favorite restaurants.',
              'Instead of making calls or waiting in line, you can browse menus, customize orders, and track deliveries in real time.',
              'Think of it like having your favorite restaurants in your pocket, ready to deliver anytime, anywhere.',
              "It's built with React Native, so it works smoothly on both iOS and Android with a clean, modern design.",
            ],
          },
          {
            id: 'food-delivery-live',
            kind: 'link',
            name: 'food-delivery-app.com',
            icon: '/images/safari.png',
            position: 'top-10 right-20',
            href: 'https://youtu.be/LKrX390fJMw?si=cExkuVhf2DTV9G2-',
          },
          {
            id: 'food-delivery-screenshot',
            kind: 'image',
            name: 'food-delivery-app.png',
            icon: '/images/image.png',
            position: 'top-52 right-80',
            imageUrl: '/images/project-3.png',
            alt: 'Screenshot of the Food Delivery App browsing a restaurant menu',
          },
        ],
      },
    ],
  },
  about: {
    id: 'about',
    name: 'About me',
    icon: '/icons/info.svg',
    children: [
      {
        id: 'about-photo',
        kind: 'image',
        name: 'me.png',
        icon: '/images/image.png',
        position: 'top-10 left-5',
        imageUrl: '/images/adrian.jpg',
        alt: 'Portrait of Adrian, the developer behind this portfolio',
      },
      {
        id: 'about-photo-casual',
        kind: 'image',
        name: 'casual-me.png',
        icon: '/images/image.png',
        position: 'top-28 right-72',
        imageUrl: '/images/adrian-2.jpg',
        alt: 'Adrian away from a screen, in casual clothes',
      },
      {
        id: 'about-photo-conference',
        kind: 'image',
        name: 'conference-me.png',
        icon: '/images/image.png',
        position: 'top-52 left-80',
        imageUrl: '/images/adrian-3.jpeg',
        alt: 'Adrian speaking at a conference',
      },
      {
        id: 'about-bio',
        kind: 'text',
        name: 'about-me.txt',
        icon: '/images/txt.png',
        position: 'top-60 left-5',
        subtitle: 'Meet the Developer Behind the Code',
        description: PROFILE.bio,
      },
    ],
  },
  resume: {
    id: 'resume',
    name: 'Resume',
    icon: '/icons/file.svg',
    children: [
      {
        id: 'resume-pdf',
        kind: 'pdf',
        name: 'Resume.pdf',
        icon: '/images/pdf.png',
        href: '/files/resume.pdf',
      },
    ],
  },
  trash: {
    id: 'trash',
    name: 'Trash',
    icon: '/icons/trash.svg',
    children: [
      {
        id: 'trash-one',
        kind: 'image',
        name: 'trash1.png',
        icon: '/images/image.png',
        position: 'top-10 left-10',
        imageUrl: '/images/trash-1.png',
        alt: 'A leftover screenshot from an earlier version of the site',
      },
      {
        id: 'trash-two',
        kind: 'image',
        name: 'trash2.png',
        icon: '/images/image.png',
        position: 'top-40 left-80',
        imageUrl: '/images/trash-2.png',
        alt: 'A second leftover screenshot from an earlier version of the site',
      },
    ],
  },
}
