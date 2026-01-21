import { faker } from '@faker-js/faker'
import { type Transaction } from './schema'

faker.seed(12345)

const transactionTypes = ['income', 'expense', 'transfer', 'savings'] as const
const categories = [
  'food',
  'transportation',
  'shopping',
  'bills',
  'entertainment',
  'healthcare',
  'education',
  'salary',
  'investment',
  'other',
] as const

const accountIds = ['acc-1', 'acc-2', 'acc-3', 'acc-4', 'acc-5']

export const transactions: Transaction[] = Array.from({ length: 50 }, () => {
  const type = faker.helpers.arrayElement(transactionTypes)
  // 20% chance of being uncategorized
  const category = faker.datatype.boolean({ probability: 0.2 })
    ? undefined
    : faker.helpers.arrayElement(categories)
  const accountId = faker.helpers.arrayElement(accountIds)
  
  // Income should be positive, expense negative, savings positive, transfer can be either
  let amount = faker.number.float({ min: 10, max: 2000, fractionDigits: 2 })
  if (type === 'expense') {
    amount = -Math.abs(amount)
  } else if (type === 'income' || type === 'savings') {
    amount = Math.abs(amount)
  }

  const date = faker.date.recent({ days: 90 })
  const createdAt = faker.date.between({ from: date, to: new Date() })

  return {
    id: `txn-${faker.string.alphanumeric(8)}`,
    description: faker.finance.transactionDescription(),
    amount,
    type,
    category,
    accountId,
    date,
    createdAt,
    updatedAt: createdAt,
  }
}).sort((a, b) => b.date.getTime() - a.date.getTime())
