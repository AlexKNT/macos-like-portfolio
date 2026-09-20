import { PROFILE } from '#content/profile'

/**
 * The greeting the desktop opens with: the lead line in the interface face at `text-4xl` and
 * the display line in the script face at `text-5xl`, both on the scrim so neither ever sits
 * directly on the photograph, and both in the desktop text token, which is white in either
 * mode because the wallpaper behind it is. The whole greeting is the page's one heading.
 *
 * It sits in the upper middle on a desktop, where it clears the icon gutter, and drops to
 * the bottom on a compact screen, where the icons have the middle to themselves and the dock
 * band is not reserved. Spec 0003, AC-2.
 */
export function Greeting() {
  return (
    <div className="absolute inset-x-0 top-[26vh] flex justify-center px-4 max-sm:top-auto max-sm:bottom-8">
      <h1 className="bg-scrim rounded-panel px-8 py-5 text-center max-sm:px-6 max-sm:py-4">
        <span className="text-desktop-text font-georama block text-4xl max-sm:text-2xl">
          {PROFILE.greeting.lead}
        </span>
        <span className="text-desktop-text font-display block text-5xl leading-tight max-sm:text-4xl">
          {PROFILE.greeting.display}
        </span>
      </h1>
    </div>
  )
}
