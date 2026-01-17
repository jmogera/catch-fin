import { Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTransactions } from './transactions-provider'

export function TransactionsPrimaryButtons() {
  const { setOpen } = useTransactions()
  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        className='space-x-1'
        onClick={() => setOpen('import')}
      >
        <span>Import</span> <Download size={18} />
      </Button>
      <Button className='space-x-1' onClick={() => setOpen('create')}>
        <span>Add Transaction</span> <Plus size={18} />
      </Button>
    </div>
  )
}
