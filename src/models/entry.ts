export interface Entry {
  id: string
  type: 'achievement' | 'setback'
  title: string
  description: string
  category: string
  date: string
  createdAt: string
}

export type EntryFields = {
  type: Entry['type']
  title: string
  date: string
  description?: string
  category?: string
}

export interface ValidationResult {
  valid: true
}

export interface ValidationFailure {
  valid: false
  errors: Partial<Record<keyof EntryFields, string>>
}

export function createEntry(fields: EntryFields): Entry {
  return {
    description: '',
    category: '',
    ...fields,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
}

export function validateEntry(
  entry: Partial<EntryFields>
): ValidationResult | ValidationFailure {
  const errors: Partial<Record<keyof EntryFields, string>> = {}

  if (!entry.title || entry.title.trim().length === 0) {
    errors.title = 'Title is required'
  } else if (entry.title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer'
  }

  if (!entry.type || !['achievement', 'setback'].includes(entry.type)) {
    errors.type = 'Type must be achievement or setback'
  }

  if (entry.description && entry.description.length > 2000) {
    errors.description = 'Description must be 2000 characters or fewer'
  }

  if (entry.category && entry.category.length > 50) {
    errors.category = 'Category must be 50 characters or fewer'
  }

  if (!entry.date || isNaN(Date.parse(entry.date))) {
    errors.date = 'A valid date is required'
  }

  return Object.keys(errors).length === 0
    ? { valid: true }
    : { valid: false, errors }
}
