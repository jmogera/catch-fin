import * as LucideIcons from 'lucide-react'
import type { Category } from '@/lib/api/categories'

export type CategoryOption = {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * Converts database categories to the format expected by UI components
 */
export function convertCategoriesToOptions(categories: Category[]): CategoryOption[] {
  return categories.map((cat) => {
    const IconComponent = (LucideIcons[cat.icon as keyof typeof LucideIcons] ||
      LucideIcons.Circle) as React.ComponentType<{ className?: string }>
    
    return {
      label: cat.label,
      value: cat.value,
      icon: IconComponent,
    }
  })
}
