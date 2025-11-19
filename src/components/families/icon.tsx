import { icons, LucideIcon } from 'lucide-react'

import { FamilyType, FamilyRole } from '@/types'

type BuiltInType = FamilyType | FamilyRole | 'Filled' | 'Empty' | 'Enabled' | 'Disabled' | string

type IconProps = {
  type: BuiltInType
  className?: string
  color?: string
  size?: number
  customIcons?: Record<string, keyof typeof icons>
}

const defaultIconsByFamilyType: Record<string, keyof typeof icons> = {
  human: 'PersonStanding',
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
    defaultIconsByFamilyType[key] ||
    defaultIconsByUserRole[key] ||
    otherDefaultIcons[key]

  const LucideIcon = icons[iconName as keyof typeof icons] as LucideIcon

  return <LucideIcon color={color} size={size} className={className} />
}
