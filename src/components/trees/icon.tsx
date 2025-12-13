import { icons, LucideIcon } from 'lucide-react'

import { TreeType, TreeAccessRole } from '@/types'

type BuiltInType =
  | TreeType
  | TreeAccessRole
  | 'Filled'
  | 'Empty'
  | 'Enabled'
  | 'Disabled'
  | 'Public'
  | 'Private'
  | string

type IconProps = {
  type: BuiltInType
  className?: string
  color?: string
  size?: number
  customIcons?: Record<string, keyof typeof icons>
}

const defaultIconsByTreeType: Record<string, keyof typeof icons> = {
  human: 'UsersRound',
  animal: 'Cat',
}

const defaultIconsByUserRole: Record<string, keyof typeof icons> = {
  admin: 'ShieldCheck',
  editor: 'Pencil',
  viewer: 'Eye',
}

const otherDefaultIcons: Record<string, keyof typeof icons> = {
  filled: 'CircleUser',
  empty: 'CircleDashed',
  enabled: 'Images',
  disabled: 'X',
  public: 'LockKeyholeOpen',
  private: 'UserLock',
  compact: 'StretchHorizontal',
  loose: 'StretchVertical',
}

export const Icon: React.FC<IconProps> = ({
  type,
  className,
  color = '#78a9af',
  size = 18,
  customIcons = {},
}) => {
  const key = type.toLowerCase()

  const iconName =
    customIcons[key] ||
    defaultIconsByTreeType[key] ||
    defaultIconsByUserRole[key] ||
    otherDefaultIcons[key]

  const LucideIcon = icons[iconName as keyof typeof icons] as LucideIcon

  return <LucideIcon color={color} size={size} className={className} />
}
