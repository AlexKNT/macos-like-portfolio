import type { Wallpaper, WallpaperId } from '#content/types'

/**
 * The three wallpapers the desktop paints: one per mode, and a portrait crop a narrow
 * screen prefers. The base layer reads them through `--wallpaper-image` and
 * `--wallpaper-image-compact`, which `#lib/appearance` writes before the first paint,
 * so no image path is hardcoded in the stylesheet. Spec 0002, AC-8.
 */
export const WALLPAPER: Record<WallpaperId, Wallpaper> = {
  light: { id: 'light', imageUrl: '/images/wallpaper.png' },
  dark: { id: 'dark', imageUrl: '/images/wallpaper-dark.png' },
  compact: { id: 'compact', imageUrl: '/images/wallpaper-compact.png' },
}
