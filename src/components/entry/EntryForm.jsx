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

const today = () => new Date().toISOString().split('T')[0]

export default function EntryForm({ onSubmit }) {
  const form = useForm({
    defaultValues: {
      type: 'achievement',
      title: '',
      description: '',
      category: '',
      date: today(),
    },
  })

  function handleSubmit(values) {
    if (!values.title || values.title.trim().length === 0) {
      form.setError('title', { message: 'Title is required' })
      return
    }
    onSubmit(values)
    form.reset({ ...form.getValues(), title: '', description: '', category: '', date: today() })
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
            validate: (v) => v.trim().length > 0 || 'Title is required',
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="entry-category">Category</FormLabel>
              <FormControl>
                <Input id="entry-category" aria-label="Category" placeholder="e.g. Work, Health" {...field} />
              </FormControl>
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

        <Button type="submit" className="w-full">
          Save Entry
        </Button>
      </form>
    </Form>
  )
}
