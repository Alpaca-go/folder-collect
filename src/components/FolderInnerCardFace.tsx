import { designPx, FOLDER_DESIGN } from '../config/folderDesign'
import { innerPocketArtDropShadow } from '../config/folderInnerCardArt'

interface FolderInnerCardFaceProps {
  scale: number
  artSrc?: string
}

export default function FolderInnerCardFace({ scale, artSrc }: FolderInnerCardFaceProps) {
  if (artSrc) {
    return (
      <img
        src={artSrc}
        alt=""
        draggable={false}
        className="pointer-events-none block h-full w-full select-none"
        style={{ filter: innerPocketArtDropShadow(scale) }}
      />
    )
  }
  const skeletonPad = designPx(FOLDER_DESIGN.innerCardSkeletonPad, scale)
  const skeletonLinePrimary = designPx(FOLDER_DESIGN.innerCardSkeletonLinePrimary, scale)
  const skeletonLineSecondary = designPx(FOLDER_DESIGN.innerCardSkeletonLineSecondary, scale)
  const skeletonGap = designPx(FOLDER_DESIGN.innerCardSkeletonGap, scale)
  const skeletonBlockGap = designPx(FOLDER_DESIGN.innerCardSkeletonBlockGap, scale)

  return (
    <div
      className="pointer-events-none select-none"
      style={{
        paddingLeft: skeletonPad,
        paddingRight: skeletonPad,
        paddingTop: skeletonPad,
      }}
    >
      <div
        className="rounded-full bg-neutral-200/90"
        style={{
          marginBottom: skeletonGap,
          height: skeletonLinePrimary,
          width: '38%',
        }}
      />
      <div
        className="rounded-full bg-neutral-100"
        style={{ height: skeletonLineSecondary, width: '58%' }}
      />
      <div
        className="rounded-full bg-neutral-100/80"
        style={{
          marginTop: skeletonBlockGap,
          height: skeletonLineSecondary,
          width: '44%',
        }}
      />
    </div>
  )
}
