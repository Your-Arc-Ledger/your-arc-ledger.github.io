import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EntryForm from '../../../src/components/entry/EntryForm.jsx'
import type { EntryFields } from '../../../src/models/entry'

describe('EntryForm', () => {
  it('renders all 5 fields', () => {
    render(<EntryForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
  })

  it('date field defaults to today', () => {
    render(<EntryForm onSubmit={vi.fn()} />)
    const today = new Date().toISOString().split('T')[0]
    expect(screen.getByLabelText(/date/i)).toHaveValue(today)
  })

  it('shows validation error on title when submitted empty and does not call onSubmit', async () => {
    const onSubmit = vi.fn()
    render(<EntryForm onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /save|submit|add/i }))
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('renders a Cancel button when onCancel is provided', () => {
    render(<EntryForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('does not render a Cancel button when onCancel is not provided', () => {
    render(<EntryForm onSubmit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  })

  it('calls onCancel when Cancel button is clicked', async () => {
    const onCancel = vi.fn()
    render(<EntryForm onSubmit={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('pre-fills fields from initialValues', () => {
    const initial: EntryFields = { type: 'lesson', title: 'Existing title', description: 'Some desc', category: 'Work', date: '2026-01-15' }
    render(<EntryForm onSubmit={vi.fn()} initialValues={initial} />)
    expect(screen.getByLabelText(/title/i)).toHaveValue('Existing title')
    expect(screen.getByLabelText(/description/i)).toHaveValue('Some desc')
    expect(screen.getByLabelText(/category/i)).toHaveValue('Work')
    expect(screen.getByLabelText(/date/i)).toHaveValue('2026-01-15')
  })

  it('uses submitLabel for the submit button text', () => {
    render(<EntryForm onSubmit={vi.fn()} submitLabel="Save Changes" />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('calls onSubmit with correctly shaped fields on valid submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EntryForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/title/i), 'My achievement')
    fireEvent.click(screen.getByRole('button', { name: /save|submit|add/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce()
    })
    const [fields] = onSubmit.mock.calls[0]
    expect(fields.title).toBe('My achievement')
    expect(['achievement', 'lesson']).toContain(fields.type)
    expect(fields.date).toBeDefined()
  })
})
