import type { Article } from '#content/types'
import { printArticleDate } from '#windows/articles/articleDate'

/** What a row needs: the post it shows. */
export type ArticleRowProps = { readonly article: Article }

/*
 * The row's own classes, named here rather than spread through the markup, so the cover's box and
 * the title's link treatment are readable as one thing each.
 *
 * The cover is a fixed square: 64 pixels on every row, painted on the sunken surface so an image
 * that never arrives still leaves a considered shape rather than a hole, with the control radius
 * the rest of the desktop uses. `shrink-0` is what keeps it 64 pixels when the title beside it is
 * long. Nothing about it is a control: the row has one target, and the cover is not it.
 *
 * The title is the link, so its colour is the link colour and it carries the underline the other
 * outbound links on this desktop carry. `min-h-touch` is what gives a title short enough for one
 * line the touch target's height without changing how it looks, and the state utilities are
 * composed rather than reimplemented, so the ring is the desktop's ring.
 */
const COVER = 'bg-surface-sunken rounded-control size-16 shrink-0 object-cover'
const TITLE =
  'text-link rounded-control focus-visible:interactive-focus flex min-h-touch min-w-0 items-center text-base font-medium underline underline-offset-2 hover:text-text'

/**
 * One post in the list: its cover beside the date it was written and its title, and the title is
 * itself the link that opens the post outside the page.
 *
 * The anchor carries `target="_blank"` with `rel="noopener noreferrer"`, so the post opens in a new
 * tab where the browser allows it and the page it lands on gets no handle back into this one. There
 * is no press handler and no `window.open`: a link that leaves the page is a real link, so the
 * browser's own behaviour (a new tab, a copied address, a followed link) is what a visitor gets.
 *
 * The title element being the anchor is what makes the visible words and the announced words the
 * same thing: there is no separate label to drift from what is on screen. A cover whose file is not
 * there is left to the browser, so the image stays where it is carrying its own description and the
 * row keeps its height.
 * Spec 0011, AC-3, AC-5, AC-6, AC-7, AC-11.
 */
export function ArticleRow({ article }: ArticleRowProps) {
  return (
    <li
      data-line=""
      className="border-divider flex items-start gap-4 border-b py-4 last:border-b-0"
    >
      <img src={article.image.imageUrl} alt={article.image.alt} className={COVER} />
      <div className="flex min-w-0 flex-col gap-1">
        <time dateTime={article.date} className="text-text-muted text-sm">
          {printArticleDate(article.date)}
        </time>
        <a href={article.href} target="_blank" rel="noopener noreferrer" className={TITLE}>
          <span className="min-w-0 break-words">{article.title}</span>
        </a>
      </div>
    </li>
  )
}
