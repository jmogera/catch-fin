import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Settings,
  Command,
} from 'lucide-react'
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
