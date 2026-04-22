// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Users } from 'lucide-react'

import { StatCard } from './stat-card'

describe('<StatCard>', () => {
  it('renders label and value', () => {
    render(<StatCard label="Members" value={59} />)
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('59')).toBeInTheDocument()
  })

  it('renders string values as-is', () => {
    render(<StatCard label="Earliest" value="April 2020" />)
    expect(screen.getByText('April 2020')).toBeInTheDocument()
  })

  it('renders the icon when provided', () => {
    const { container } = render(<StatCard label="Members" value={5} icon={Users} />)
    // lucide-react icons render as <svg>
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders subtext when provided', () => {
    render(<StatCard label="Avg. age" value={42} subtext="years" />)
    expect(screen.getByText('years')).toBeInTheDocument()
  })
})
