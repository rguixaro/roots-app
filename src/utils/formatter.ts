import { TreeNodeGender } from '@/types'
import type { ActivityAction } from '@prisma/client'

export interface ActivityDisplay {
  title: string
  subtitle: string
  details?: string[]
}

/**
 * Formats a value based on its field type.
 * @param value
 * @param field
 * @param t Translation function
 * @returns The formatted value as string
 */
const formatValue = (value: any, field: string, t: (key: string) => string): string => {
  const dateFields = ['birthDate', 'deathDate']
  if (dateFields.includes(field)) return new Date(value).toLocaleDateString()

  if (field === 'gender' && TreeNodeGender.includes(value)) return t(value.toLowerCase())

  return String(value)
}

export const formatActivityLog = (
  action: ActivityAction,
  metadata: Record<string, any> | null,
  t: (key: string) => string
): ActivityDisplay => {
  if (!metadata) return { title: t(action), subtitle: '' }
  const meta = metadata as Record<string, any>

  switch (action) {
    case 'NODE_CREATED':
      return { title: t('NODE_CREATED'), subtitle: `"${meta.nodeName}"` }
    case 'NODE_UPDATED':
      return {
        title: t('NODE_UPDATED'),
        subtitle: `"${meta.nodeName}"`,
        details: meta.changes
          ? Object.entries(meta.changes).map(
              ([field, change]: [string, any]) =>
                `${t(field)}: "${formatValue(change.before, field, t)}" → "${formatValue(change.after, field, t)}"`
            )
          : undefined,
      }
    case 'NODE_DELETED':
      return { title: t('NODE_DELETED'), subtitle: `"${meta.nodeName}"` }
    case 'EDGE_CREATED':
      return {
        title: t('EDGE_CREATED'),
        subtitle: `"${meta.fromNodeName}" → "${meta.toNodeName}"`,
        details: [t('edge-type') + ': ' + t(meta.type.toLowerCase())],
      }
    case 'EDGE_DELETED':
      return {
        title: t('EDGE_DELETED'),
        subtitle: `"${meta.fromNodeName}" → "${meta.toNodeName}"`,
        details: [t('edge-type') + ': ' + t(meta.type.toLowerCase())],
      }
    case 'PICTURE_ADDED':
      return { title: t('PICTURE_ADDED'), subtitle: meta.fileKey || 'Untitled' }
    case 'PICTURE_DELETED':
      return {
        title: t('PICTURE_DELETED'),
        subtitle: meta.fileKey || 'Untitled',
        details: meta.taggedNodeNames
          ? [`${t('tagged')}: ${meta.taggedNodeNames.join(', ')}`]
          : undefined,
      }
    case 'PICTURE_TAG_CREATED':
      return { title: t('PICTURE_TAG_CREATED'), subtitle: `"${meta.nodeName}"` }
    case 'PICTURE_TAG_DELETED':
      return { title: t('PICTURE_TAG_DELETED'), subtitle: `"${meta.nodeName}"` }
    case 'TREE_UPDATED':
      return {
        title: t('TREE_UPDATED'),
        subtitle: `"${meta.treeName}"`,
        details: meta.changes
          ? Object.entries(meta.changes).map(
              ([field, change]: [string, any]) =>
                `${t(field)}: "${formatValue(change.before, field, t)}" → "${formatValue(change.after, field, t)}"`
            )
          : undefined,
      }
    case 'SHARE_TOKEN_GENERATED':
      return {
        title: t('SHARE_TOKEN_GENERATED'),
        subtitle: meta.expiresAt
          ? `${t('expires-on')} ${new Date(meta.expiresAt).toLocaleDateString()}`
          : '',
      }
    case 'MEMBER_JOINED_VIA_SHARE':
      return {
        title: t('MEMBER_JOINED_VIA_SHARE'),
        subtitle: meta.joinedName ? `"${meta.joinedName}"` : '',
      }

    default:
      return { title: t(action), subtitle: '' }
  }
}
