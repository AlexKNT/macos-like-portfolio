import { parseColour } from '#lib/contrast'
import type { Rgb } from '#lib/contrast'

/** The two sets of token values a stylesheet declares: the light set and the dark one. */
export type TokenLayer = {
  readonly light: Readonly<Record<string, Rgb>>
  readonly dark: Readonly<Record<string, Rgb>>
}

/** The declarations inside the first block whose opening a pattern matches. */
function readBlock(stylesheet: string, pattern: RegExp): string {
  const opening = pattern.exec(stylesheet)

  if (!opening) {
    throw new Error(`the stylesheet has no block matching ${pattern}`)
  }

  const start = stylesheet.indexOf('{', opening.index)
  const end = stylesheet.indexOf('}', start)

  if (start === -1 || end === -1) {
    throw new Error(`the block matching ${pattern} is not closed`)
  }

  return stylesheet.slice(start + 1, end)
}

/**
 * Reads every colour token in a block, so the suite never retypes a value that lives in
 * the stylesheet. A token the parser cannot read is an error rather than a skipped pair.
 */
function readColours(block: string, blockName: string): Record<string, Rgb> {
  const colours: Record<string, Rgb> = {}
  const declaration = /(--color-[a-z0-9-]+)\s*:\s*([^;]+);/g

  for (const [, name, value] of block.matchAll(declaration)) {
    const colour = parseColour(value!)

    if (!colour) {
      throw new Error(`${blockName} declares ${name} as "${value!.trim()}", which is not a colour`)
    }

    colours[name!] = colour
  }

  return colours
}

/**
 * Reads the token layer out of the stylesheet text: the values from the theme block, and
 * the overrides that follow in the dark block. The dark set is the light set with the
 * overrides laid over it, which is how the cascade resolves it at runtime.
 */
export function readTokenLayer(stylesheet: string): TokenLayer {
  const light = readColours(readBlock(stylesheet, /@theme static\s*\{/), 'the theme block')
  const dark = {
    ...light,
    ...readColours(readBlock(stylesheet, /\[data-theme='dark'\]\s*\{/), 'the dark block'),
  }

  return { light, dark }
}

/** The names of the tokens the dark block overrides. */
export function darkOverrides(stylesheet: string): readonly string[] {
  return Object.keys(
    readColours(readBlock(stylesheet, /\[data-theme='dark'\]\s*\{/), 'the dark block'),
  )
}

/** One colour token, or a readable error naming the token the stylesheet is missing. */
export function token(layer: TokenLayer, mode: 'light' | 'dark', name: string): Rgb {
  const colour = layer[mode][name]

  if (!colour) {
    throw new Error(`the ${mode} tokens declare no ${name}`)
  }

  return colour
}
