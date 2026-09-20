import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { WALLPAPER } from '#content/theme'
import { wallpaperIdSchema } from '#content/types'

/** The stylesheet read off disk, so the check reads what the author wrote. */
const STYLESHEET = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

describe('the wallpaper registry', () => {
  it('holds an entry for every wallpaper id', () => {
    expect(Object.keys(WALLPAPER).sort()).toEqual([...wallpaperIdSchema.options].sort())
  })

  it('keeps every wallpaper path out of the stylesheet', () => {
    const hardcoded = Object.values(WALLPAPER)
      .map(({ imageUrl }) => imageUrl)
      .filter((imageUrl) => STYLESHEET.includes(imageUrl))

    expect(hardcoded).toEqual([])
  })

  it('keeps the three paths distinct, so a mode never reuses another image', () => {
    const paths = Object.values(WALLPAPER).map(({ imageUrl }) => imageUrl)

    expect([...new Set(paths)]).toHaveLength(paths.length)
  })
})
