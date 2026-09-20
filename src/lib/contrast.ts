/**
 * Colour maths for the contrast suite, so the ratios are computed rather than trusted.
 * Pure functions over plain values: same input, same output.
 */

/** A colour with 0 to 255 channels and an alpha of 0 to 1. */
export type Rgb = {
  readonly r: number
  readonly g: number
  readonly b: number
  readonly alpha: number
}

/**
 * Reads a colour out of a CSS value. Understands the two forms the token layer uses,
 * `#rrggbb` and `rgb(r g b / a)`, and returns undefined for anything else, so a token
 * the suite cannot read is a failure rather than a silently skipped pair.
 */
export function parseColour(value: string): Rgb | undefined {
  const text = value.trim()

  const hex = /^#([0-9a-f]{6})$/i.exec(text)
  if (hex) {
    const digits = hex[1]!
    return {
      r: Number.parseInt(digits.slice(0, 2), 16),
      g: Number.parseInt(digits.slice(2, 4), 16),
      b: Number.parseInt(digits.slice(4, 6), 16),
      alpha: 1,
    }
  }

  const rgb =
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/i.exec(text)
  if (rgb) {
    const alpha = rgb[4]
    const alphaValue = alpha
      ? alpha.endsWith('%')
        ? Number.parseFloat(alpha) / 100
        : Number.parseFloat(alpha)
      : 1

    return {
      r: Number.parseFloat(rgb[1]!),
      g: Number.parseFloat(rgb[2]!),
      b: Number.parseFloat(rgb[3]!),
      alpha: alphaValue,
    }
  }

  return undefined
}

/** Lays a possibly translucent colour over an opaque one, giving an opaque result. */
export function composite(source: Rgb, backdrop: Rgb): Rgb {
  const mix = (front: number, back: number) => front * source.alpha + back * (1 - source.alpha)

  return {
    r: mix(source.r, backdrop.r),
    g: mix(source.g, backdrop.g),
    b: mix(source.b, backdrop.b),
    alpha: 1,
  }
}

/** The WCAG relative luminance of an opaque colour. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const srgb = value / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** The WCAG contrast ratio between two opaque colours, from 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (lighter! + 0.05) / (darker! + 0.05)
}

/** Rounds a ratio to two places, for a readable failure message. */
export function roundRatio(ratio: number): number {
  return Math.round(ratio * 100) / 100
}
