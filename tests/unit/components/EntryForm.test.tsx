import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EntryForm from '../../../src/components/entry/EntryForm.jsx'

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
    expect(['achievement', 'setback']).toContain(fields.type)
    expect(fields.date).toBeDefined()
  })
})
