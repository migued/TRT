import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Webhook, Plus, Activity, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { WebhooksList } from '@/components/webhooks/webhooks-list'
import { CreateWebhookButton } from '@/components/webhooks/create-webhook-button'

interface WebhooksPageProps {
  params: Promise<{ workspace: string }>
}

export default async function WebhooksPage({ params }: WebhooksPageProps) {
  const { workspace: workspaceSlug } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    redirect('/login')
  }

  // Get all webhooks
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  // Get recent webhook logs
  const { data: recentLogs } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const incomingWebhooks = webhooks?.filter(w => w.type === 'incoming') || []
  const outgoingWebhooks = webhooks?.filter(w => w.type === 'outgoing') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Webhooks</h1>
          <p className="mt-1 text-sm text-slate-600">
            Connect external services and automate workflows
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/docs/webhooks"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Documentación
          </Link>
          <CreateWebhookButton
            workspaceSlug={workspaceSlug}
            workspaceId={workspace.id}
          />
        </div>
      </div>

      {/* Help Banner (only show if no webhooks) */}
      {(!webhooks || webhooks.length === 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                ¿Primera vez usando Webhooks?
              </h3>
              <p className="text-slate-700 mb-4">
                Los webhooks te permiten conectar tu CRM con servicios externos como formularios web, Zapier, Slack y más.
                Recibe datos automáticamente o envía notificaciones cuando ocurran eventos importantes.
              </p>
              <Link
                href="/docs/webhooks"
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Ver Documentación Completa
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Webhook className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Webhooks</p>
              <p className="text-2xl font-bold text-slate-900">{webhooks?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Webhooks</p>
              <p className="text-2xl font-bold text-slate-900">
                {webhooks?.filter(w => w.is_active).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Recent Calls</p>
              <p className="text-2xl font-bold text-slate-900">{recentLogs?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Webhooks */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Incoming Webhooks</h2>
          <p className="text-sm text-slate-600 mt-1">
            Receive data from external forms and services
          </p>
        </div>
        <div className="p-6">
          {incomingWebhooks.length > 0 ? (
            <WebhooksList
              webhooks={incomingWebhooks}
              workspaceSlug={workspaceSlug}
            />
          ) : (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No incoming webhooks configured</p>
              <p className="text-sm text-slate-500 mb-4">
                Create an incoming webhook to receive data from external forms, Zapier, Make.com, or custom integrations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Outgoing Webhooks */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Outgoing Webhooks</h2>
          <p className="text-sm text-slate-600 mt-1">
            Send CRM events to external services
          </p>
        </div>
        <div className="p-6">
          {outgoingWebhooks.length > 0 ? (
            <WebhooksList
              webhooks={outgoingWebhooks}
              workspaceSlug={workspaceSlug}
            />
          ) : (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No outgoing webhooks configured</p>
              <p className="text-sm text-slate-500 mb-4">
                Create an outgoing webhook to send CRM events to external services when contacts are created, opportunities won, etc.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentLogs && recentLogs.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <Link
              href={`/${workspaceSlug}/settings/webhooks/logs`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all logs
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {recentLogs.map((log) => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{log.event}</p>
                      <p className="text-xs text-slate-600">
                        {log.type === 'incoming' ? 'Incoming' : 'Outgoing'} • {log.response_status || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    {log.response_time_ms && (
                      <p className="text-xs text-slate-500">{log.response_time_ms}ms</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
