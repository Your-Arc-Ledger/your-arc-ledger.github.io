import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

interface CategorySelectProps {
  value: string[]
  onChange: (value: string[]) => void
  categories: string[]
  onAddCategory?: (name: string) => void
}

export default function CategorySelect({ value, onChange, categories, onAddCategory }: CategorySelectProps) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const trimmed = inputValue.trim()
  const filtered = categories.filter(
    (c) => c.toLowerCase().includes(trimmed.toLowerCase()) && !value.includes(c)
  )
  const showAdd = trimmed.length > 0 &&
    !categories.some((c) => c.toLowerCase() === trimmed.toLowerCase()) &&
    !value.some((c) => c.toLowerCase() === trimmed.toLowerCase())

  function select(cat: string) {
    onChange([...value, cat])
    setInputValue('')
  }

  function remove(cat: string) {
    onChange(value.filter((c) => c !== cat))
  }

  function addNew() {
    if (!trimmed) return
    onChange([...value, trimmed])
    onAddCategory?.(trimmed)
    setInputValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showAdd) { addNew(); return }
      if (filtered[0]) { select(filtered[0]); return }
    }
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  const dropdownVisible = open && (filtered.length > 0 || showAdd)

  return (
    <div ref={containerRef} className="relative">
      <div
        className="min-h-8 w-full flex flex-wrap gap-1 items-center rounded-lg border border-input bg-transparent px-2.5 py-1 cursor-text transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center gap-0.5 bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-xs"
          >
            {cat}
            <button
              type="button"
              aria-label={`Remove ${cat}`}
              className="ml-0.5 hover:text-destructive leading-none"
              onClick={(e) => { e.stopPropagation(); remove(cat) }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id="entry-category"
          aria-label="Category"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Select or add categories…' : ''}
          className="flex-1 min-w-24 outline-none bg-transparent text-sm placeholder:text-muted-foreground"
        />
      </div>

      {dropdownVisible && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-input bg-background shadow-md max-h-48 overflow-y-auto">
          {filtered.map((cat) => (
            <button
              key={cat}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent"
              onMouseDown={(e) => { e.preventDefault(); select(cat) }}
            >
              {cat}
            </button>
          ))}
          {showAdd && (
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent border-t border-input"
              onMouseDown={(e) => { e.preventDefault(); addNew() }}
            >
              Add "{trimmed}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}
