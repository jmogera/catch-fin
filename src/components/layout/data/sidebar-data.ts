import { LayoutDashboard, Wallet, Receipt, Settings, Command, PiggyBank } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'User',
    email: 'user@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Catch Fin',
      logo: Command,
      plan: 'Personal Finance',
    },
  ],
  navGroups: [
    {
      title: 'Finance',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Budget',
          url: '/budget',
          icon: PiggyBank,
        },
        {
          title: 'Transactions',
          url: '/transactions',
          icon: Receipt,
        },
        {
          title: 'Accounts',
          url: '/accounts',
          icon: Wallet,
        },
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}
