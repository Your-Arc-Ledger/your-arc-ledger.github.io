import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import CategorySelect from './CategorySelect'

import type { EntryFields } from '@/models/entry'

const today = () => new Date().toISOString().split('T')[0]

type FormValues = EntryFields

interface EntryFormProps {
  onSubmit: (fields: EntryFields) => void
  initialValues?: Partial<EntryFields>
  onCancel?: () => void
  submitLabel?: string
  categories?: string[]
  onAddCategory?: (name: string) => void
}

export default function EntryForm({ onSubmit, initialValues, onCancel, submitLabel = 'Save Entry', categories = [], onAddCategory }: EntryFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      type: initialValues?.type ?? 'achievement',
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      categories: initialValues?.categories ?? [],
      date: initialValues?.date ?? today(),
    },
  })

  function handleSubmit(values: FormValues) {
    if (!values.title || values.title.trim().length === 0) {
      form.setError('title', { message: 'Title is required' })
      return
    }
    onSubmit(values)
    if (!onCancel) {
      form.reset({ ...form.getValues(), title: '', description: '', categories: [], date: today() })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="entry-type">Type</FormLabel>
              <FormControl>
                <select
                  id="entry-type"
                  aria-label="Type"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                  {...field}
                >
                  <option value="achievement">Achievement</option>
                  <option value="setback">Setback</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          rules={{
            required: 'Title is required',
            validate: (v: string) => v.trim().length > 0 || 'Title is required',
            maxLength: { value: 200, message: 'Title must be 200 characters or fewer' },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="entry-title">Title</FormLabel>
              <FormControl>
                <Input id="entry-title" aria-label="Title" placeholder="What happened?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="entry-description">Description</FormLabel>
              <FormControl>
                <Textarea
                  id="entry-description"
                  aria-label="Description"
                  placeholder="Optional details…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="entry-category">Category</FormLabel>
              <CategorySelect
                value={(field.value as string[]) ?? []}
                onChange={field.onChange}
                categories={categories}
                onAddCategory={onAddCategory}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          rules={{ required: 'A valid date is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="entry-date">Date</FormLabel>
              <FormControl>
                <Input id="entry-date" aria-label="Date" type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" className={onCancel ? 'flex-1' : 'w-full'}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
