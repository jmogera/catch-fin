import { ContentSection } from '../components/content-section'
import { CategoriesForm } from './categories-form'

export function SettingsCategories() {
  return (
    <ContentSection
      title='Categories'
      desc='Manage your transaction categories. Customize labels and organize your transactions.'
    >
      <CategoriesForm />
    </ContentSection>
  )
}
