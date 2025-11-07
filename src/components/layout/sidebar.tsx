'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  Building2,
  TrendingUp,
  FileText,
  ShoppingCart,
  FolderKanban,
  Package,
  DollarSign,
  Inbox,
  Settings,
  LogOut,
  MessageSquare,
  ScanLine
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  workspaceSlug: string
}

export function Sidebar({ workspaceSlug }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navigation = [
    {
      name: 'Dashboard',
      href: `/${workspaceSlug}`,
      icon: TrendingUp,
      exact: true,
    },
    {
      name: 'Contactos',
      href: `/${workspaceSlug}/contactos`,
      icon: Users,
    },
    {
      name: 'Empresas',
      href: `/${workspaceSlug}/empresas`,
      icon: Building2,
    },
    {
      name: 'Oportunidades',
      href: `/${workspaceSlug}/oportunidades`,
      icon: TrendingUp,
    },
    {
      name: 'Cotizaciones',
      href: `/${workspaceSlug}/cotizaciones`,
      icon: FileText,
    },
    {
      name: 'Órdenes',
      href: `/${workspaceSlug}/ordenes`,
      icon: ShoppingCart,
    },
    {
      name: 'Proyectos',
      href: `/${workspaceSlug}/proyectos`,
      icon: FolderKanban,
    },
    {
      name: 'Productos',
      href: `/${workspaceSlug}/productos`,
      icon: Package,
    },
    {
      name: 'Finanzas',
      href: `/${workspaceSlug}/finanzas`,
      icon: DollarSign,
    },
    {
      name: 'Chat con IA',
      href: `/${workspaceSlug}/chat-con-ia`,
      icon: MessageSquare,
    },
    {
      name: 'Escáner',
      href: `/${workspaceSlug}/escaner`,
      icon: ScanLine,
    },
    {
      name: 'Inbox',
      href: `/${workspaceSlug}/inbox`,
      icon: Inbox,
      badge: '2', // TODO: Dynamic from actual data
    },
  ]

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold">TRT Platform</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                    ${
                      active
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-800 p-3">
        <Link
          href={`/${workspaceSlug}/settings`}
          className={`
            flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
            ${
              isActive(`/${workspaceSlug}/settings`)
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }
          `}
        >
          <Settings className="h-5 w-5" />
          <span>Configuración</span>
        </Link>

        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
