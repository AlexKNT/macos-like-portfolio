import type { CSSProperties } from 'react'

import type { Social } from '#content/types'

/** What one tile needs: the social entry it paints, which holds its own colour and its own icon. */
export type SocialTileProps = { readonly social: Social }

/*
 * The tile's face. The pointer state is a small lift under the pointer, timed from the motion
 * tokens, so reduced motion needs no second path: every duration resolves to zero when the visitor
 * asks for less movement, and the lift simply happens at once.
 *
 * It deliberately composes none of the wash state utilities. Every one of those is built from
 * tokens that flip with the mode, and a tile's surface does not flip, so a wash would paint a dark
 * bar over a brand colour in dark mode. The ring and the lift are the whole pointer treatment.
 *
 * `--dock-hover-lift` is the design system's one measure for how far a control rises under the
 * pointer; there is no window side name for it yet, which is a gap rather than a choice.
 * Spec 0008, AC-7.
 */
const TILE_FACE =
  'focus-visible:interactive-focus rounded-panel flex min-h-touch min-w-0 flex-1 items-center gap-3 px-3 py-2 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] hover:-translate-y-[var(--dock-hover-lift)]'

/**
 * The two values only the content layer can supply: the entry's own brand surface, and the file its
 * icon is drawn from. Neither is a token, because the brand colour belongs to the brand.
 *
 * React's `CSSProperties` carries no index signature for custom properties, so the object is
 * asserted once, here, rather than at each tile. The value is read from the entry rather than typed
 * into this module, which is what keeps the window free of a colour of its own.
 */
function tileStyle(social: Social): CSSProperties {
  return {
    backgroundColor: social.color,
    '--brand-icon': `url('${social.icon}')`,
  } as CSSProperties
}

/**
 * One social profile as a single link: the entry's own icon and the entry's own label, on the
 * entry's own brand colour.
 *
 * The icon is a white line drawing, and white measures between 2.1:1 and 3.0:1 on these four brand
 * colours, so it is never painted as an image. It is a masked block instead, painted in the label's
 * own ink, which is the trick the menu bar's logo already uses: the icon and the label therefore
 * always read against the tile together, and no brand colour change can leave one passing while the
 * other fails.
 *
 * The icon is decoration and is hidden from assistive tech, so the link's accessible name is its
 * label alone and nothing about the profile depends on seeing a mark. The link opens in a new tab
 * with `rel="noopener noreferrer"`, so the page it opens gets no handle on this one, which is what
 * the project's link files do too.
 *
 * A missing icon file leaves the tile whole: the label still names it and the link still works.
 * Spec 0008, AC-7, AC-8, AC-10.
 */
export function SocialTile({ social }: SocialTileProps) {
  return (
    <a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      style={tileStyle(social)}
      className={TILE_FACE}
    >
      <span aria-hidden="true" className="brand-mask bg-text-on-brand size-5 shrink-0" />
      <span className="text-text-on-brand min-w-0 break-words text-sm font-semibold">
        {social.label}
      </span>
    </a>
  )
}
