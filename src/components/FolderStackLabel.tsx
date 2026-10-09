import {
  FOLDER_DESIGN,
  folderFontSize,
  folderHeightRatio,
  folderStackLabelInset,
} from '../config/folderDesign'

interface FolderStackLabelProps {
  name: string
  flipped: boolean
  /** Defaults to container-query sizing (matches FolderCard stack). */
  fontSize?: string
}

export default function FolderStackLabel({ name, flipped, fontSize }: FolderStackLabelProps) {
  const labelInset = folderStackLabelInset(flipped)

  return (
    <span
      className="folder-stack-label absolute font-medium tracking-tight text-neutral-900 select-none"
      style={{
        top: folderHeightRatio(FOLDER_DESIGN.labelTop),
        left: labelInset.left,
        right: labelInset.right,
        transform: labelInset.transform,
        transformOrigin: labelInset.transformOrigin,
        fontSize: fontSize ?? folderFontSize(FOLDER_DESIGN.labelFontSize),
      }}
    >
      {name}
    </span>
  )
}
