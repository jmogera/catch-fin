import { createFileRoute } from '@tanstack/react-router'
import { Budget } from '@/features/budget'

export const Route = createFileRoute('/_authenticated/budget')({
  component: Budget,
})

