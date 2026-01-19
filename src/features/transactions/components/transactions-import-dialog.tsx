import { useState, useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useAccounts } from '@/hooks/use-accounts'
import { accountTypes } from '@/features/accounts/data/data'
import { useTransactions } from '@/hooks/use-transactions'
import { toast } from 'sonner'
import { parseCSV, parseDate, parseAmount } from '@/lib/csv-parser'
import type { Transaction } from '../data/schema'
import { useCategories } from '@/hooks/use-categories'
import { convertCategoriesToOptions } from '../utils/category-helpers'
import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const step1Schema = z.object({
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, {
      message: 'Please upload a file',
    })
    .refine(
      (files) =>
        ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(
          files?.[0]?.type
        ) || files?.[0]?.name.endsWith('.csv'),
      'Please upload CSV format.'
    ),
  accountId: z.string().min(1, 'Please select an account'),
})

const step2Schema = z.object({
  dateColumn: z.string().min(1, 'Date column is required'),
  descriptionColumn: z.string().min(1, 'Description column is required'),
  amountColumn: z.string().min(1, 'Amount column is required'),
  categoryColumn: z.string().optional().or(z.literal('__none__').transform(() => undefined)),
})

type TransactionsImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ImportStep = 'select' | 'map'

export function TransactionsImportDialog({
  open,
  onOpenChange,
}: TransactionsImportDialogProps) {
  const { accounts } = useAccounts()
  const { bulkCreate, isBulkCreating } = useTransactions()
  const [step, setStep] = useState<ImportStep>('select')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]) // Filtered headers for display
  const [csvRows, setCsvRows] = useState<string[][]>([])
  const [originalHeaders, setOriginalHeaders] = useState<string[]>([]) // Original headers for index lookup
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  const step1Form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: { file: undefined, accountId: '' },
  })

  const step2Form = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      dateColumn: '',
      descriptionColumn: '',
      amountColumn: '',
      categoryColumn: '',
    },
  })

  // Parse CSV when file is selected
  const handleFileSelect = async (file: File) => {
    try {
      const rows = await parseCSV(file)
      if (rows.length === 0) {
        toast.error('CSV file is empty')
        return
      }

      // Keep original headers for index lookup, filter for display
      const allHeaders = rows[0]
      const validHeaders = allHeaders.filter((h) => h && h.trim() && h.trim().length > 0)
      
      if (validHeaders.length === 0) {
        toast.error('CSV file has no valid column headers')
        return
      }

      setOriginalHeaders(allHeaders) // Store original for index lookup
      setCsvHeaders(validHeaders) // Store filtered for display
      setCsvRows(rows.slice(1, 6)) // Show first 5 rows as preview
      setSelectedFile(file)

      // Auto-detect column mappings (search in original headers)
      const headerLower = allHeaders.map((h) => h.toLowerCase())
      const dateIndex = headerLower.findIndex((h) =>
        h && /date|transaction.*date|posted.*date/i.test(h)
      )
      const descIndex = headerLower.findIndex((h) =>
        h && /description|memo|note|details|merchant/i.test(h)
      )
      const amountIndex = headerLower.findIndex((h) =>
        h && /amount|total|value|price|cost/i.test(h)
      )
      const categoryIndex = headerLower.findIndex((h) =>
        h && /category|type|class/i.test(h)
      )

      step2Form.reset({
        dateColumn: dateIndex >= 0 && allHeaders[dateIndex] ? allHeaders[dateIndex] : '',
        descriptionColumn: descIndex >= 0 && allHeaders[descIndex] ? allHeaders[descIndex] : '',
        amountColumn: amountIndex >= 0 && allHeaders[amountIndex] ? allHeaders[amountIndex] : '',
        categoryColumn: categoryIndex >= 0 && allHeaders[categoryIndex] ? allHeaders[categoryIndex] : '__none__',
      })
    } catch (error) {
      toast.error('Failed to parse CSV file')
      console.error(error)
    }
  }

  const onStep1Submit = async (data: z.infer<typeof step1Schema>) => {
    const file = data.file?.[0]
    if (file) {
      setSelectedAccountId(data.accountId)
      await handleFileSelect(file)
      setStep('map')
    }
  }

  const onStep2Submit = async (data: z.infer<typeof step2Schema>) => {
    if (!selectedFile || !selectedAccountId) return

    try {
      const allRows = await parseCSV(selectedFile)
      const allHeaders = allRows[0]
      // Filter out empty headers - but keep original indices for lookup
      const validHeaders = allHeaders.filter((h) => h && h.trim() && h.trim().length > 0)
      const dataRows = allRows.slice(1)

      // Find indices in original headers array (before filtering)
      const dateIndex = allHeaders.indexOf(data.dateColumn)
      const descriptionIndex = allHeaders.indexOf(data.descriptionColumn)
      const amountIndex = allHeaders.indexOf(data.amountColumn)
      const categoryIndex = data.categoryColumn && data.categoryColumn !== '__none__'
        ? allHeaders.indexOf(data.categoryColumn)
        : -1

      if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
        toast.error('Invalid column mapping')
        return
      }

      const transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] =
        []

      for (const row of dataRows) {
        if (row.length < Math.max(dateIndex, descriptionIndex, amountIndex) + 1) {
          continue // Skip incomplete rows
        }

        const date = parseDate(row[dateIndex])
        const description = row[descriptionIndex]?.trim()
        const amount = parseAmount(row[amountIndex])
        const categoryValue = categoryIndex >= 0 ? row[categoryIndex]?.trim() : undefined

        if (!date || !description || amount === null) {
          continue // Skip invalid rows
        }

        // Determine transaction type from amount
        const type: Transaction['type'] =
          amount > 0 ? 'income' : amount < 0 ? 'expense' : 'transfer'

        // Map category if available
        let category: Transaction['category'] | undefined = undefined
        if (categoryValue) {
          const matchedCategory = categories.find(
            (c) => c.label.toLowerCase() === categoryValue.toLowerCase() ||
                   c.value === categoryValue.toLowerCase()
          )
          category = matchedCategory?.value
        }

        transactions.push({
          description,
          amount,
          type,
          category,
          accountId: selectedAccountId,
          date,
        })
      }

      if (transactions.length === 0) {
        toast.error('No valid transactions found in CSV')
        return
      }

      bulkCreate(transactions, {
        onSuccess: () => {
          toast.success(`Successfully imported ${transactions.length} transactions`)
          handleClose()
        },
        onError: (error) => {
          toast.error('Failed to import transactions')
          console.error(error)
        },
      })
    } catch (error) {
      toast.error('Failed to process CSV file')
      console.error(error)
    }
  }

  const handleClose = () => {
    setStep('select')
    setCsvHeaders([])
    setCsvRows([])
    setOriginalHeaders([])
    setSelectedFile(null)
    setSelectedAccountId('')
    step1Form.reset()
    step2Form.reset()
    onOpenChange(false)
  }

  const handleBack = () => {
    setStep('select')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='gap-2 sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            Import Transactions {step === 'map' && '(Step 2 of 2)'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? 'Select an account and CSV file to import transactions.'
              : 'Map CSV columns to transaction properties.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <Form {...step1Form}>
            <form
              id='transactions-import-step1-form'
              onSubmit={step1Form.handleSubmit(onStep1Submit)}
            >
              <div className='space-y-4'>
                <FormField
                  control={step1Form.control}
                  name='accountId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select an account' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => {
                            const accountType = accountTypes.find(
                              (type) => type.value === account.type
                            )
                            return (
                              <SelectItem key={account.id} value={account.id}>
                                <div className='flex items-center gap-2'>
                                  {accountType?.icon && (
                                    <accountType.icon className='h-4 w-4' />
                                  )}
                                  <span>{account.name}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={step1Form.control}
                  name='file'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSV File</FormLabel>
                      <FormControl>
                        <Input
                          type='file'
                          accept='.csv'
                          onChange={(e) => {
                            field.onChange(e.target.files)
                            if (e.target.files?.[0]) {
                              handleFileSelect(e.target.files[0])
                            }
                          }}
                          className='h-8 py-0'
                        />
                      </FormControl>
                      <FormDescription>
                        Upload a CSV file with transaction data
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        )}

        {step === 'map' && csvHeaders.length > 0 && (
          <Form {...step2Form}>
            <form
              id='transactions-import-step2-form'
              onSubmit={step2Form.handleSubmit(onStep2Submit)}
            >
              <div className='space-y-4'>
                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    Map each CSV column to the corresponding transaction property.
                    Preview shows first 5 rows.
                  </AlertDescription>
                </Alert>

                <div className='space-y-4'>
                  <FormField
                    control={step2Form.control}
                    name='dateColumn'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Column *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select date column' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {csvHeaders.filter((h) => h && h.trim()).map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step2Form.control}
                    name='descriptionColumn'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description Column *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select description column' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {csvHeaders.filter((h) => h && h.trim()).map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step2Form.control}
                    name='amountColumn'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Column *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select amount column' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {csvHeaders.filter((h) => h && h.trim()).map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step2Form.control}
                    name='categoryColumn'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Column (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === '__none__' ? undefined : value)}
                          value={field.value || '__none__'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select category column (optional)' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='__none__'>None</SelectItem>
                            {csvHeaders.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          If your CSV has a category column, select it here
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {csvRows.length > 0 && originalHeaders.length > 0 && (
                  <div className='mt-4'>
                    <FormLabel>Preview (First 5 rows)</FormLabel>
                    <div className='mt-2 rounded-md border overflow-x-auto'>
                      <table className='w-full text-sm'>
                        <thead>
                          <tr className='border-b bg-muted/50'>
                            {originalHeaders.map((header, idx) => (
                              <th
                                key={idx}
                                className='px-3 py-2 text-left font-medium'
                              >
                                {header || `Column ${idx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvRows.map((row, rowIdx) => (
                            <tr key={rowIdx} className='border-b'>
                              {originalHeaders.map((_, colIdx) => (
                                <td key={colIdx} className='px-3 py-2'>
                                  {row[colIdx] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </Form>
        )}

        <DialogFooter className='gap-2'>
          {step === 'map' && (
            <Button type='button' variant='outline' onClick={handleBack}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back
            </Button>
          )}
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            disabled={isBulkCreating}
          >
            Cancel
          </Button>
          {step === 'select' && (
            <Button
              type='submit'
              form='transactions-import-step1-form'
              disabled={!step1Form.watch('file')?.[0] || !step1Form.watch('accountId')}
            >
              Next
              <ArrowRight className='h-4 w-4 ml-2' />
            </Button>
          )}
          {step === 'map' && (
            <Button
              type='submit'
              form='transactions-import-step2-form'
              disabled={isBulkCreating}
            >
              {isBulkCreating ? 'Importing...' : 'Import Transactions'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
