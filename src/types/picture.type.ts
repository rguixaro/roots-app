export interface PictureTag {
  id: string

  nodeId: string
  isProfile: boolean

  pictureId: string
  picture?: Picture

  node?: {
    id: string
    fullName: string
  }
}

export interface Picture {
  id: string
  treeId: string

  fileKey: string

  uploadedBy: string

  createdAt: Date
  updatedAt: Date

  tags?: PictureTag[]
}
