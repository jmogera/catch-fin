import { faker } from '@faker-js/faker'
import { type Account } from './schema'

faker.seed(12345)

const accountTypes = [
  'checking',
  'savings',
  'credit',
  'investment',
  'cash',
] as const

export const accounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Primary Checking',
    type: 'checking',
    balance: 5420.50,
    currency: 'USD',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'acc-2',
    name: 'Savings Account',
    type: 'savings',
    balance: 12500.00,
    currency: 'USD',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'acc-3',
    name: 'Credit Card',
    type: 'credit',
    balance: -1250.75,
    currency: 'USD',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
  {
    id: 'acc-4',
    name: 'Investment Portfolio',
    type: 'investment',
    balance: 35000.00,
    currency: 'USD',
    createdAt: new Date('2023-06-10'),
    updatedAt: new Date(),
  },
  {
    id: 'acc-5',
    name: 'Cash',
    type: 'cash',
    balance: 250.00,
    currency: 'USD',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
]
