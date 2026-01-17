import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccounts } from './accounts-provider'

export function AccountsPrimaryButtons() {
  const { setOpen } = useAccounts()
  return (
    <Button className='space-x-1' onClick={() => setOpen('create')}>
      <span>Add Account</span> <Plus size={18} />
    </Button>
  )
}
