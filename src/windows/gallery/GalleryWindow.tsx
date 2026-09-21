import { WINDOWS } from '#content/windows'
import { QuietLine } from '#windows/QuietLine'
import { WindowStage } from '#windows/WindowStage'
import { AlbumSidebar } from '#windows/gallery/AlbumSidebar'
import { PhotoGrid } from '#windows/gallery/PhotoGrid'
import { PhotoViewer } from '#windows/gallery/PhotoViewer'
import { noAlbumsLine, photoAnnouncement } from '#windows/gallery/galleryLines'
import { useGalleryState } from '#windows/gallery/useGalleryState'
import type { WindowBodyProps } from '#windows/WindowBody'

/**
 * The Gallery window: the albums down one side and the photos of the album showing in the content
 * area, with a photo opening into the viewer inside the same window.
 *
 * The window is its content and its own words on the stage the other windows already share. It
 * holds no target of its own, asks the manager for nothing and reaches outside the page for
 * nothing: the albums come from the content layer, the album showing and the photo open come from
 * the window's own state, and every literal a visitor reads comes from `galleryLines`.
 *
 * Two names are deliberately different. The content region is named by the album showing, so a
 * screen reader arrives in the album it is reading, while the frame keeps the window's own title
 * from `WINDOWS.gallery.title`, which no album changes: the album names the content, never the
 * window.
 * Spec 0010, AC-1, AC-2, AC-3, AC-5, AC-8, AC-10, AC-13, AC-14.
 */
export function GalleryWindow({ windowId }: WindowBodyProps) {
  const {
    album,
    openPhoto,
    chooseAlbum,
    openPhotoAt,
    closePhoto,
    stepPhoto,
    regionRef,
    panelRef,
    tileRef,
  } = useGalleryState()

  if (album === null) {
    return (
      <WindowStage name={WINDOWS[windowId].title}>
        <QuietLine>{noAlbumsLine()}</QuietLine>
      </WindowStage>
    )
  }

  const showing = openPhoto === null ? null : (album.photos[openPhoto] ?? null)
  const status =
    showing === null || openPhoto === null
      ? ''
      : photoAnnouncement(openPhoto + 1, album.photos.length, showing.alt)

  return (
    <WindowStage
      name={album.title}
      heading={album.title}
      side={<AlbumSidebar albumId={album.id} onChoose={chooseAlbum} />}
      status={status}
      regionRef={regionRef}
    >
      {showing === null ? (
        <PhotoGrid album={album} onOpen={openPhotoAt} tileRef={tileRef} />
      ) : (
        <PhotoViewer photo={showing} onClose={closePhoto} onStep={stepPhoto} panelRef={panelRef} />
      )}
    </WindowStage>
  )
}
