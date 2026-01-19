import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUserSettings } from '@/hooks/use-user-settings'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

const budgetFormSchema = z.object({
  savingsPercentage: z
    .number()
    .min(0, 'Savings percentage must be at least 0%')
    .max(100, 'Savings percentage cannot exceed 100%'),
})

type BudgetFormValues = z.infer<typeof budgetFormSchema>

export function BudgetForm() {
  const { settings, isLoading, updateSettings, isUpdating } = useUserSettings()

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      savingsPercentage: settings?.savingsPercentage ?? 20,
    },
    values: settings
      ? {
          savingsPercentage: settings.savingsPercentage,
        }
      : undefined,
  })

  function onSubmit(data: BudgetFormValues) {
    updateSettings({ savingsPercentage: data.savingsPercentage })
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-20 w-full' />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='savingsPercentage'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Savings Target Percentage</FormLabel>
              <FormControl>
                <div className='flex items-center space-x-2'>
                  <Input
                    type='number'
                    step='0.1'
                    min='0'
                    max='100'
                    placeholder='20'
                    className='w-32'
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      field.onChange(isNaN(value) ? 0 : value)
                    }}
                    value={field.value ?? ''}
                  />
                  <span className='text-muted-foreground'>%</span>
                </div>
              </FormControl>
              <FormDescription>
                Set your target savings percentage of income. For example, if you
                set 30% and your income is $10,000, your savings target is $3,000.
                If you're currently saving 20%, you'll need to reduce expenses by
                10% to meet your target.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={isUpdating}>
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}
