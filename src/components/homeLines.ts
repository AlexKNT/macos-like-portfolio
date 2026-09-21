/*
 * The phone shell's own words, and the only ones it has. It invents exactly one: the name of the
 * surface the tiles stand on. Everything else a phone prints comes from the content layer (a tile's
 * name is its window's title, the controls keep their own accessible names, the time is a reading),
 * so no component in the shell words a sentence of its own. Spec 0009, AC-2, AC-14.
 */

/**
 * The surface the phone's tiles stand on. One word, read from here three times over: it names the
 * container the home surface lives in, the heading over the tiles, and the list of tiles itself.
 * Spec 0009, AC-2.
 */
export const HOME_SURFACE = 'Home'
