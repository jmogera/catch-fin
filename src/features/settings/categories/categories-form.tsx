import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useCategories } from '@/hooks/use-categories'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import * as LucideIcons from 'lucide-react'

const categoryFormSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label must be less than 50 characters'),
  value: z.string().min(1, 'Value is required').max(50, 'Value must be less than 50 characters'),
  icon: z.string().min(1, 'Icon is required'),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

type Category = {
  id?: string
  label: string
  value: string
  icon: string
}

// Common icon names to show in the selector
const commonIcons = [
  'Utensils', 'Car', 'ShoppingBag', 'Receipt', 'Film', 'Heart', 'GraduationCap',
  'DollarSign', 'TrendingUp', 'Circle', 'Home', 'Coffee', 'Plane', 'Train',
  'Bus', 'Bike', 'Gift', 'Music', 'Book', 'Briefcase', 'CreditCard', 'Wallet',
  'PiggyBank', 'Building', 'Phone', 'Laptop', 'Gamepad2', 'Camera', 'Shirt',
] as const

// Map default categories to their icon names
const iconNameMap: Record<string, string> = {
  Utensils: 'Utensils',
  Car: 'Car',
  ShoppingBag: 'ShoppingBag',
  Receipt: 'Receipt',
  Film: 'Film',
  Heart: 'Heart',
  GraduationCap: 'GraduationCap',
  DollarSign: 'DollarSign',
  TrendingUp: 'TrendingUp',
  Circle: 'Circle',
}

export function CategoriesForm() {
  const { categories: dbCategories, isLoading, create, update, delete: deleteCategory, seedDefaults } = useCategories()
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Convert database categories to form format
  const categories: Category[] = dbCategories.map((cat) => ({
    id: cat.id,
    label: cat.label,
    value: cat.value,
    icon: cat.icon,
  }))

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      label: '',
      value: '',
      icon: 'Circle',
    },
  })

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    form.reset({
      label: category.label,
      value: category.value,
      icon: category.icon,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const category = categories.find((c) => c.id === id)
    if (window.confirm(`Are you sure you want to delete "${category?.label}"? This action cannot be undone.`)) {
      deleteCategory(id, {
        onSuccess: () => {
          toast.success('Category deleted')
        },
        onError: (error) => {
          toast.error('Failed to delete category')
          console.error(error)
        },
      })
    }
  }

  const handleAdd = () => {
    setEditingCategory(null)
    form.reset({
      label: '',
      value: '',
      icon: 'Circle',
    })
    setIsDialogOpen(true)
  }

  const onSubmit = (data: CategoryFormValues) => {
    if (editingCategory && editingCategory.id) {
      // Update existing category
      update(
        {
          id: editingCategory.id,
          updates: {
            label: data.label,
            icon: data.icon,
            // Note: value cannot be changed after creation
          },
        },
        {
          onSuccess: () => {
            toast.success('Category updated')
            setIsDialogOpen(false)
            form.reset()
          },
          onError: (error) => {
            toast.error('Failed to update category')
            console.error(error)
          },
        }
      )
    } else {
      // Add new category
      if (categories.some((cat) => cat.value === data.value)) {
        toast.error('A category with this value already exists')
        return
      }
      create(
        {
          label: data.label,
          value: data.value,
          icon: data.icon,
        },
        {
          onSuccess: () => {
            toast.success('Category added')
            setIsDialogOpen(false)
            form.reset()
          },
          onError: (error) => {
            toast.error('Failed to add category')
            console.error(error)
          },
        }
      )
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h4 className='text-sm font-medium'>Transaction Categories</h4>
          <p className='text-sm text-muted-foreground'>
            Manage categories for organizing your transactions
          </p>
        </div>
        <div className='flex gap-2'>
          {categories.length === 0 && (
            <Button
              onClick={() => {
                seedDefaults(undefined, {
                  onSuccess: () => {
                    toast.success('Default categories added')
                  },
                  onError: (error) => {
                    toast.error('Failed to add default categories')
                    console.error(error)
                  },
                })
              }}
              variant='outline'
              size='sm'
            >
              <Plus className='mr-2 h-4 w-4' />
              Seed Default Categories
            </Button>
          )}
          <Button onClick={handleAdd} size='sm'>
            <Plus className='mr-2 h-4 w-4' />
            Add Category
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <p className='text-muted-foreground'>Loading categories...</p>
        </div>
      ) : (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[50px]'>Icon</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className='w-[100px] text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className='h-24 text-center'>
                    No categories found. Click "Add Category" to create one.
                  </TableCell>
                </TableRow>
              ) : (
              categories.map((category) => {
                const IconComponent = LucideIcons[category.icon as keyof typeof LucideIcons] as React.ComponentType<{
                  className?: string
                }>
                return (
                  <TableRow key={category.value}>
                    <TableCell>
                      {IconComponent && (
                        <IconComponent className='h-5 w-5 text-muted-foreground' />
                      )}
                    </TableCell>
                    <TableCell className='font-medium'>{category.label}</TableCell>
                    <TableCell>
                      <Badge variant='secondary' className='font-mono text-xs'>
                        {category.value}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-destructive hover:text-destructive'
                      onClick={() => category.id && handleDelete(category.id)}
                      disabled={!category.id}
                    >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details below.'
                : 'Create a new category for your transactions.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='label'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., Groceries' {...field} />
                    </FormControl>
                    <FormDescription>
                      The display name for this category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='value'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., groceries'
                        {...field}
                        disabled={!!editingCategory}
                      />
                    </FormControl>
                    <FormDescription>
                      The internal identifier (cannot be changed after creation)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='icon'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select an icon' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className='max-h-[300px]'>
                        {commonIcons.map((iconName) => {
                          const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{
                            className?: string
                          }>
                          return (
                            <SelectItem key={iconName} value={iconName}>
                              <div className='flex items-center gap-2'>
                                {Icon && <Icon className='h-4 w-4' />}
                                <span>{iconName}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>Choose an icon for this category</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsDialogOpen(false)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type='submit'>
                  {editingCategory ? 'Update' : 'Create'} Category
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
