export interface PictureTag {
  id: string

  nodeId: string
  isProfile: boolean

  pictureId: string
  picture?: Picture

  node?: {
    id: string
    fullName: string
    alias: string | null
  }
}

export interface Picture {
  id: string
  treeId: string

  fileKey: string

  uploadedBy: string

  date?: Date | null
  metadata?: PictureMetadata | null

  createdAt: Date
  updatedAt: Date

  tags?: PictureTag[]
}

export type PictureMetadata = {
  takenAt?: Date
  width?: number
  height?: number
  orientation?: number
  camera?: {
    make?: string
    model?: string
  }
  gps?: {
    lat: number
    lng: number
    altitude?: number
  }
  source?: {
    hasExif: boolean
    exifDates?: {
      original?: Date
      created?: Date
      modified?: Date
    }
  }
}
