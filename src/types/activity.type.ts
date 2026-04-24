import { JsonValue } from 'next-auth/adapters'

import { Tree } from './tree.type'
import { User } from './user.type'

export const ActivityAction = [
  'NODE_CREATED',
  'NODE_UPDATED',
  'NODE_DELETED',

  'EDGE_CREATED',
  'EDGE_DELETED',

  'PICTURE_ADDED',
  'PICTURE_DELETED',

  'PICTURE_TAG_CREATED',
  'PICTURE_TAG_DELETED',

  'TREE_UPDATED',

  'SHARE_TOKEN_GENERATED',
  'MEMBER_JOINED_VIA_SHARE',

  'NOTE_UPDATED',
] as const
export type ActivityAction = (typeof ActivityAction)[number]

export interface ActivityLog {
  id: string
  treeId: string
  tree: Tree

  action: ActivityAction
  entityId?: string | null

  metadata?: JsonValue | null

  createdBy: string | null
  user: Pick<User, 'id' | 'name' | 'image'> | null

  createdAt: Date
}
