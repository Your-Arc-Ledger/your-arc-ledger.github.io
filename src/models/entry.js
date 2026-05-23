export function createEntry(fields) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...fields,
  }
}

export function validateEntry(entry) {
  const errors = {}

  if (!entry.title || entry.title.trim().length === 0) {
    errors.title = 'Title is required'
  } else if (entry.title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer'
  }

  if (!['achievement', 'setback'].includes(entry.type)) {
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
