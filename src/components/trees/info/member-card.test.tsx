// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Stub Picture so we don't pull in next/image + framer-motion in jsdom.
vi.mock('@/ui', () => ({
  Picture: ({ fileKey }: { fileKey?: string | null }) =>
    fileKey ? (
      // eslint-disable-next-line @next/next/no-img-element, @typescript-eslint/no-explicit-any
      <img src={fileKey as any} alt="" data-testid="picture" />
    ) : (
      <div data-testid="picture-placeholder" />
    ),
}))

import { MemberCard } from './member-card'

describe('<MemberCard>', () => {
  it('renders name and primary metadata', () => {
    render(<MemberCard name="Alice" primary="5 children" picture="abc.jpg" />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('5 children')).toBeInTheDocument()
    expect(screen.getByTestId('picture')).toHaveAttribute('src', 'abc.jpg')
  })

  it('renders placeholder when picture is missing', () => {
    render(<MemberCard name="Bob" primary="92 years" />)
    expect(screen.getByTestId('picture-placeholder')).toBeInTheDocument()
    expect(screen.queryByTestId('picture')).not.toBeInTheDocument()
  })

  it('renders secondary line when provided', () => {
    render(
      <MemberCard
        name="Charlie"
        primary="3 years since passing"
        secondary="May 5"
      />
    )
    expect(screen.getByText('May 5')).toBeInTheDocument()
  })

  it('omits primary and secondary paragraphs when not provided', () => {
    render(<MemberCard name="Dana" />)
    expect(screen.getByText('Dana')).toBeInTheDocument()
    // Card should only have one text paragraph (the name)
    const paragraphs = screen.getAllByText(/.+/).filter((el) => el.tagName === 'P')
    expect(paragraphs).toHaveLength(1)
  })

  it('applies line-clamp to names so long surnames can wrap', () => {
    render(<MemberCard name="Maria Antonia Garcia Puig" />)
    const nameEl = screen.getByText('Maria Antonia Garcia Puig')
    expect(nameEl.className).toMatch(/line-clamp-2/)
  })
})
