import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategorySelect from '../../../src/components/entry/CategorySelect'

const ALL_CATEGORIES = ['Health', 'Leadership', 'Work']

describe('CategorySelect', () => {
  it('renders the category input with accessible label hook', () => {
    render(<CategorySelect value={[]} onChange={vi.fn()} categories={ALL_CATEGORIES} />)
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
  })

  it('shows no chips when value is empty', () => {
    render(<CategorySelect value={[]} onChange={vi.fn()} categories={ALL_CATEGORIES} />)
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('renders a chip for each selected category', () => {
    render(<CategorySelect value={['Work', 'Health']} onChange={vi.fn()} categories={ALL_CATEGORIES} />)
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('Health')).toBeInTheDocument()
  })

  it('calls onChange without the category when its chip is removed', () => {
    const onChange = vi.fn()
    render(<CategorySelect value={['Work', 'Health']} onChange={onChange} categories={ALL_CATEGORIES} />)
    fireEvent.click(screen.getByRole('button', { name: /remove work/i }))
    expect(onChange).toHaveBeenCalledWith(['Health'])
  })

  it('shows existing categories in dropdown when the input is focused', () => {
    render(<CategorySelect value={[]} onChange={vi.fn()} categories={ALL_CATEGORIES} />)
    fireEvent.focus(screen.getByLabelText(/category/i))
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('Health')).toBeInTheDocument()
    expect(screen.getByText('Leadership')).toBeInTheDocument()
  })

  it('excludes already-selected categories from the dropdown', () => {
    render(<CategorySelect value={['Work']} onChange={vi.fn()} categories={ALL_CATEGORIES} />)
    fireEvent.focus(screen.getByLabelText(/category/i))
    expect(screen.queryByRole('button', { name: 'Work' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Health' })).toBeInTheDocument()
  })

  it('adds a category when clicked in the dropdown and calls onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CategorySelect value={[]} onChange={onChange} categories={ALL_CATEGORIES} />)
    await user.click(screen.getByLabelText(/category/i))
    await user.click(screen.getByRole('button', { name: 'Work' }))
    expect(onChange).toHaveBeenCalledWith(['Work'])
  })

  it('filters dropdown options by input text', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value={[]} onChange={vi.fn()} categories={ALL_CATEGORIES} />)
    await user.type(screen.getByLabelText(/category/i), 'hea')
    expect(screen.getByRole('button', { name: 'Health' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Work' })).not.toBeInTheDocument()
  })

  it('shows an add option when typed value is not an existing category', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value={[]} onChange={vi.fn()} categories={ALL_CATEGORIES} />)
    await user.type(screen.getByLabelText(/category/i), 'Innovation')
    expect(screen.getByRole('button', { name: /add "innovation"/i })).toBeInTheDocument()
  })

  it('calls onChange and onAddCategory when the add option is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onAddCategory = vi.fn()
    render(<CategorySelect value={[]} onChange={onChange} categories={ALL_CATEGORIES} onAddCategory={onAddCategory} />)
    await user.type(screen.getByLabelText(/category/i), 'Innovation')
    await user.click(screen.getByRole('button', { name: /add "innovation"/i }))
    expect(onChange).toHaveBeenCalledWith(['Innovation'])
    expect(onAddCategory).toHaveBeenCalledWith('Innovation')
  })

  it('does not show the add option when the typed value matches an existing category', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value={[]} onChange={vi.fn()} categories={ALL_CATEGORIES} />)
    await user.type(screen.getByLabelText(/category/i), 'Work')
    expect(screen.queryByRole('button', { name: /add "work"/i })).not.toBeInTheDocument()
  })
})
