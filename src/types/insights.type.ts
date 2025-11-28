export interface Milestone {
  id: string
  name: string
  treeName: string
  treeSlug: string
  date: string
  age?: number
  day?: number
  daysUntil?: number
  yearsAgo?: number
  type?: 'birth' | 'death'
}

export interface MilestonesResponse {
  birthdays: Milestone[]
  anniversaries: Milestone[]
}

export interface Highlight {
  id: string
  name: string
  treeName: string
  treeSlug: string
  addedAt?: string
  birthDate?: string
  birthYear?: number
  childrenCount?: number
  photoCount?: number
}

export interface HighlightsResponse {
  oldest: Highlight | null
  newest: Highlight | null
  largest: Highlight | null
  mostPhotos: Highlight | null
}

export type HighlightCard = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  value: string
  subtitle: string
  treeName: string
  treeSlug: string
}
