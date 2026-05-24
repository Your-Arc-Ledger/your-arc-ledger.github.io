# Performance Improvements Backlog

Remaining items from the Vercel React best-practices review (2026-05-24).
Items 1 and 2 from the original list have already been resolved.

---

## 3. Version localStorage keys — `client-localstorage-schema` (MEDIUM-HIGH)

**File:** `src/lib/storage.ts:1–2`

**Problem:** Keys have no version suffix. If the stored object shape ever changes, existing users silently load stale/incompatible data with no migration path.

**Fix:** Rename the constants and migrate old keys on first load.

```ts
// Before
const SHEET_REF_KEY = 'arc-spreadsheet'
const SESSION_HINT_KEY = 'arc-session-hint'

// After
const SHEET_REF_KEY = 'arc-spreadsheet:v1'
const SESSION_HINT_KEY = 'arc-session-hint:v1'
```

Add a one-time migration in each `load*` function that reads the old unversioned key, writes it to the new versioned key, and removes the old one. Tests need updating too: any test that calls `localStorage.setItem('arc-spreadsheet', ...)` must use the new key.

---

## 4. Memoize `addEntry`/`updateEntry` in `useEntries` — `rerender-functional-setstate` (MEDIUM)

**File:** `src/hooks/useEntries.ts:36–89`

**Problem:** Both functions are plain `async function` declarations inside the hook body, so they are recreated on every render. `useCategories.addCategory` is correctly wrapped in `useCallback`; these should match.

**Fix:** Wrap both in `useCallback`.

```ts
const addEntry = useCallback(async (fields: EntryFields) => {
  // ... existing body unchanged
}, [authState.status, authState.accessToken, dispatch])

const updateEntry = useCallback(async (entry: Entry) => {
  // ... existing body unchanged
}, [authState.status, authState.accessToken, dispatch])
```

Tests to update: any test that checks referential stability of these functions, or that mocks the hook return value — no structural changes needed, just dep-array coverage.

---

## 5. Inline arrow function per entry in `EntryList` — (MEDIUM)

**File:** `src/components/entry/EntryList.tsx:69`

**Problem:** `() => onEdit(entry)` is a new function instance for every entry on every render. If `EntryCard` is ever memoized this silently breaks it.

**Fix:** Pass `entry` as a prop to `EntryCard` and bind inside, or introduce a small memoized row component.

```tsx
// Option A — pass entry, bind inside EntryCard (simplest)
// In EntryList:
items.map((entry) => (
  <EntryCard key={entry.id} entry={entry} onEdit={onEdit} />
))

// In EntryCard — change signature:
export default function EntryCard({ entry, onEdit }: { entry: Entry; onEdit?: (entry: Entry) => void }) {
  // ...
  {onEdit && (
    <Button onClick={() => onEdit(entry)}>Edit</Button>
  )}
}
```

Option B is a memoized `EntryRow` wrapper, but Option A is sufficient and simpler.

---

## 6. Combine array passes in `EntrySummary` + memoize cutoff — `js-combine-iterations` (MEDIUM)

**File:** `src/components/summary/EntrySummary.tsx:10–16`

**Problem:** Three separate `.filter()` passes over `state.items`, and `new Date()` runs on every render.

**Fix:**

```tsx
const { achievementCount, setbackCount } = useMemo(() => {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - WINDOW_DAYS)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  let achievementCount = 0
  let setbackCount = 0
  for (const e of state.items) {
    if (e.date < cutoffStr) continue
    if (e.type === 'achievement') achievementCount++
    else setbackCount++
  }
  return { achievementCount, setbackCount }
}, [state.items])
```

The `useMemo` dependency is `state.items`, so it only recalculates when entries actually change (not on filter, saving, or other status updates).

---

## 7. `toSorted()` instead of spread + sort — `js-tosorted-immutable` (LOW-MEDIUM)

**File:** `src/components/entry/EntryList.tsx:25`

**Problem:** `[...filtered].sort(...)` creates an unnecessary intermediate array.

**Fix:**

```ts
// Before
const items = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

// After
const items = filtered.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
```

Check that `tsconfig.json` targets `ES2023` or later (or has `lib: ["ES2023"]`) so `toSorted` is available. Currently `vite-env.d.ts` targets `ES2020` — may need a `lib` bump or a polyfill note in the PR.

---

## 8. Inconsistent form show/hide in `App.tsx` — `rendering-conditional-render` (LOW)

**File:** `src/App.tsx:47–59`

**Problem:** The "new entry" form uses `className="hidden"` (always mounted, react-hook-form state kept alive). The edit form uses `&&` (conditionally mounted). This is inconsistent and keeps the new-entry form's dirty state alive unnecessarily while editing.

**Fix:** Use conditional rendering for both, or use the `hidden` class for both if preserving state across toggling is intentional.

```tsx
// Option A — both conditionally rendered (cleaner)
{!editingEntry && (
  <EntryForm onSubmit={handleSubmit} categories={categories} onAddCategory={addCategory} />
)}
{editingEntry && (
  <EntryForm
    initialValues={editingEntry}
    onSubmit={handleEditSave}
    onCancel={() => setEditingEntry(null)}
    submitLabel="Save Changes"
    categories={categories}
    onAddCategory={addCategory}
  />
)}
```

If the intent is to preserve the user's in-progress new entry while they view/edit another, keep both forms mounted with `hidden`. Just document that intent with a comment.
