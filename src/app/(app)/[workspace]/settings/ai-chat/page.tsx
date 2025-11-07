import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AIUsageDisplay from '@/components/ai-chat/usage-display'

interface AISettingsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function AISettingsPage({ params }: AISettingsPageProps) {
  const { workspace: workspaceSlug } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch usage data
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-chat/usage`, {
    headers: {
      'Cookie': `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    cache: 'no-store'
  })

  let usageData = null
  if (response.ok) {
    usageData = await response.json()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Uso de AI Chat</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitorea tu uso mensual del asistente de IA
        </p>
      </div>

      <AIUsageDisplay initialData={usageData} />
    </div>
  )
}
