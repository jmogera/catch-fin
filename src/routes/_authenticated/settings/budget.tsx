import { createFileRoute } from '@tanstack/react-router'
import { SettingsBudget } from '@/features/settings/budget'

export const Route = createFileRoute('/_authenticated/settings/budget')({
  component: SettingsBudget,
})
