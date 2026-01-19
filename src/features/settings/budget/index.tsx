import { ContentSection } from '../components/content-section'
import { BudgetForm } from './budget-form'

export function SettingsBudget() {
  return (
    <ContentSection
      title='Budget'
      desc='Set your savings target percentage to track your financial goals.'
    >
      <BudgetForm />
    </ContentSection>
  )
}
