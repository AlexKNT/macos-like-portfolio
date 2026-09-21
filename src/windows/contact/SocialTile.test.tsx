import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SOCIALS } from '#content/profile'
import { SocialTile } from '#windows/contact/SocialTile'
import type { Social } from '#content/types'

/**
 * One tile on its own: the link it becomes, the name it carries, the way its icon is drawn and the
 * surface it paints. A tile is the only element in the whole app that paints a colour the token
 * layer does not name, and it paints it from its own content entry.
 * Spec 0008, AC-7, AC-8, AC-10.
 */

/** The social entry at one spot, or a loud failure: the content layer always holds four. */
function socialAt(index: number): Social {
  const social = SOCIALS[index]

  if (social === undefined) {
    throw new Error(`the content layer holds no social entry at ${index}`)
  }

  return social
}

describe('a social tile', () => {
  // covers: AC-7
  it('is one link named by its label alone, opening in a new tab with no handle on this page', () => {
    const social = socialAt(0)

    render(<SocialTile social={social} />)

    const link = screen.getByRole('link')

    expect(link).toHaveAccessibleName(social.label)
    expect(link).toHaveAttribute('href', social.href)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  // covers: AC-7, AC-10
  it('draws its icon through a mask rather than as an image, and hides it from assistive tech', () => {
    const social = socialAt(0)

    const { container } = render(<SocialTile social={social} />)

    // No image element at all: these four icons are white line drawings, and white measures under
    // 3:1 on most of the brand colours, so a plain image would paint a mark that cannot be read.
    expect(container.querySelector('img')).toBeNull()

    const icon = container.querySelector('[aria-hidden="true"]')

    expect(icon).not.toBeNull()
    expect(icon).toHaveClass('brand-mask')
    expect(icon).toHaveClass('bg-text-on-brand')

    // The file the tile masks comes from the entry, so no module names an icon path.
    expect(screen.getByRole('link').style.getPropertyValue('--brand-icon')).toBe(
      `url('${social.icon}')`,
    )
  })

  // covers: AC-8
  it('paints the surface its own entry carries and the fixed ink on its label', () => {
    for (const social of SOCIALS) {
      const view = render(<SocialTile social={social} />)
      const link = screen.getByRole('link')

      expect(link, social.label).toHaveStyle({ backgroundColor: social.color })
      expect(link.textContent, social.label).toContain(social.label)
      // The label and the masked icon share one ink, so a brand colour change cannot leave one of
      // them readable and the other not.
      expect(link.querySelector('.text-text-on-brand'), social.label).not.toBeNull()

      view.unmount()
    }
  })

  // covers: AC-11
  it('keeps at least a touch target of height, so a narrow window can still be pressed', () => {
    render(<SocialTile social={socialAt(0)} />)

    expect(screen.getByRole('link')).toHaveClass('min-h-touch')
  })
})
