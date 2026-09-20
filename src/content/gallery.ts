import type { Album } from '#content/types'

/**
 * The gallery albums and the photos inside them. An album with an empty `photos` array
 * is valid content: it typechecks, it builds, and nothing has to invent a placeholder
 * entry for it. Spec 0001, AC-5.
 */
export const ALBUMS: readonly Album[] = [
  {
    id: 'library',
    title: 'Library',
    icon: '/icons/gicon1.svg',
    photos: [
      { id: 'library-1', imageUrl: '/images/gal1.png', alt: 'Placeholder gallery photo one' },
      { id: 'library-2', imageUrl: '/images/gal2.png', alt: 'Placeholder gallery photo two' },
      { id: 'library-3', imageUrl: '/images/gal3.png', alt: 'Placeholder gallery photo three' },
      { id: 'library-4', imageUrl: '/images/gal4.png', alt: 'Placeholder gallery photo four' },
    ],
  },
  { id: 'memories', title: 'Memories', icon: '/icons/gicon2.svg', photos: [] },
  { id: 'places', title: 'Places', icon: '/icons/file.svg', photos: [] },
  { id: 'people', title: 'People', icon: '/icons/gicon4.svg', photos: [] },
  { id: 'favorites', title: 'Favorites', icon: '/icons/gicon5.svg', photos: [] },
]
