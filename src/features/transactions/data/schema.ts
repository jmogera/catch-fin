import { z } from 'zod'

export const transactionTypeSchema = z.union([
  z.literal('income'),
  z.literal('expense'),
  z.literal('transfer'),
])

export const transactionCategorySchema = z.union([
  z.literal('food'),
  z.literal('transportation'),
  z.literal('shopping'),
  z.literal('bills'),
  z.literal('entertainment'),
  z.literal('healthcare'),
  z.literal('education'),
  z.literal('salary'),
  z.literal('investment'),
  z.literal('other'),
  z.literal('uncategorized'),
])

export const transactionSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number(),
  type: transactionTypeSchema,
  category: transactionCategorySchema.optional(),
  accountId: z.string(),
  date: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Transaction = z.infer<typeof transactionSchema>
export type TransactionType = z.infer<typeof transactionTypeSchema>
export type TransactionCategory = z.infer<typeof transactionCategorySchema>

export const transactionListSchema = z.array(transactionSchema)
