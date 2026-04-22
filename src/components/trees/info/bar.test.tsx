// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Bar, StackedBar } from './bar'

describe('<Bar>', () => {
  it('renders label, value/total, and percentage by default', () => {
    render(<Bar label="Birth date" value={7} total={10} />)
    expect(screen.getByText('Birth date')).toBeInTheDocument()
    expect(screen.getByText('7/10')).toBeInTheDocument()
    expect(screen.getByText('(70%)')).toBeInTheDocument()
  })

  it('hides the percentage when showPercent is false', () => {
    render(<Bar label="81-100" value={2} total={2} valueLabel="2" showPercent={false} />)
    expect(screen.getByText('81-100')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.queryByText(/\(.*%\)/)).not.toBeInTheDocument()
  })

  it('uses the custom valueLabel instead of value/total', () => {
    render(<Bar label="Death" value={3} total={10} valueLabel="3 of 10 deceased" />)
    expect(screen.getByText('3 of 10 deceased')).toBeInTheDocument()
    expect(screen.queryByText('3/10')).not.toBeInTheDocument()
  })

  it('clamps width to 0% when total is 0 (no division by zero)', () => {
    const { container } = render(<Bar label="Empty" value={5} total={0} />)
    // Find the fill div — it's the child of the track
    const fill = container.querySelector('.bg-ocean-300') as HTMLElement
    expect(fill).toBeTruthy()
    expect(fill.style.width).toBe('0%')
    expect(screen.getByText('(0%)')).toBeInTheDocument()
  })
})

describe('<StackedBar>', () => {
  it('returns null when all segments sum to zero', () => {
    const { container } = render(
      <StackedBar
        segments={[
          { label: 'A', value: 0, color: 'bg-ocean-300' },
          { label: 'B', value: 0, color: 'bg-ocean-400' },
        ]}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders each non-zero segment with its label, value, and percentage', () => {
    render(
      <StackedBar
        segments={[
          { label: 'Male', value: 3, color: 'bg-ocean-300' },
          { label: 'Female', value: 1, color: 'bg-ocean-400' },
        ]}
      />
    )
    expect(screen.getByText('Male')).toBeInTheDocument()
    expect(screen.getByText(/3 \(75%\)/)).toBeInTheDocument()
    expect(screen.getByText('Female')).toBeInTheDocument()
    expect(screen.getByText(/1 \(25%\)/)).toBeInTheDocument()
  })
})
