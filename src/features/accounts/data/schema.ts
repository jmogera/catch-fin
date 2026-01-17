import { z } from 'zod'

export const accountTypeSchema = z.union([
  z.literal('checking'),
  z.literal('savings'),
  z.literal('credit'),
  z.literal('investment'),
  z.literal('cash'),
  z.literal('other'),
])

export const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: accountTypeSchema,
  balance: z.number(),
  currency: z.string().default('USD'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Account = z.infer<typeof accountSchema>
export type AccountType = z.infer<typeof accountTypeSchema>

export const accountListSchema = z.array(accountSchema)
