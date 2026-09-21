/** The media query function the environment shipped, put back by `restoreLayout`. */
const REAL_MATCH_MEDIA = window.matchMedia

/**
 * Answers the compact question the way a phone answers it, so a tree rendered afterwards is created
 * already in the phone shell instead of swapping to it after its first render. Every other query
 * answers false. It is a plain helper rather than a hook, so no module reads it as one.
 * Spec 0009, AC-1.
 */
export function phoneLayout(): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: query.includes('40rem'),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  })
}

/** Puts the environment's own media query back, so one check's phone does not shape the next. */
export function restoreLayout(): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: REAL_MATCH_MEDIA,
  })
}
