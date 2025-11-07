'use client'

import { useState } from 'react'
import { Check, Copy, Code, Zap, ArrowRight, Lock, Activity, Globe, Webhook as WebhookIcon } from 'lucide-react'

export default function WebhooksDocsPage() {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <WebhookIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Documentación de Webhooks</h1>
              <p className="text-lg text-slate-600 mt-2">
                Conecta tu CRM con servicios externos y automatiza tus workflows
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'incoming'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📥 Webhooks Entrantes
            </button>
            <button
              onClick={() => setActiveTab('outgoing')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'outgoing'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📤 Webhooks Salientes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Incoming Webhooks */}
        {activeTab === 'incoming' && (
          <div className="space-y-12">
            {/* What is it */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">¿Qué son los Webhooks Entrantes?</h2>
              <p className="text-lg text-slate-700 mb-4">
                Los webhooks entrantes te permiten <strong>recibir datos de servicios externos</strong> directamente
                en tu CRM. Es como tener una puerta de entrada automática que recibe visitantes (datos) y los
                registra en tu sistema.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Formularios Web</h3>
                  <p className="text-sm text-slate-600">
                    Conecta formularios de contacto, registros y encuestas directamente a tu CRM
                  </p>
                </div>

                <div className="p-6 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg w-fit mb-3">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Automatización</h3>
                  <p className="text-sm text-slate-600">
                    Integra con Zapier, Make.com y otras herramientas de automatización
                  </p>
                </div>

                <div className="p-6 bg-purple-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg w-fit mb-3">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Tiempo Real</h3>
                  <p className="text-sm text-slate-600">
                    Los datos llegan instantáneamente, sin necesidad de importaciones manuales
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Start */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">🚀 Inicio Rápido</h2>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">Crear un Webhook Entrante</h3>
                    <p className="text-slate-700 mb-3">
                      Ve a <code className="px-2 py-1 bg-slate-100 rounded text-sm">Configuración → Webhooks</code> y
                      haz clic en &quot;Crear Webhook&quot;. Selecciona tipo &quot;Entrante&quot;.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">Obtén tu URL</h3>
                    <p className="text-slate-700 mb-3">
                      Una vez creado, obtendrás una URL única como:
                    </p>
                    <div className="relative">
                      <code className="block bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                        https://tu-dominio.com/api/webhooks/incoming/whk_abc123def456...
                      </code>
                      <button className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">Configura tu Servicio Externo</h3>
                    <p className="text-slate-700 mb-3">
                      Pega la URL en tu formulario, Zapier, o servicio externo. ¡Listo! 🎉
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Format Examples */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">📝 Ejemplos de Uso</h2>

              {/* Contact Example */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Crear un Contacto</h3>
                <p className="text-slate-700 mb-4">
                  Envía este formato para crear automáticamente un contacto en tu CRM:
                </p>

                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto">
{`{
  "event": "contact",
  "data": {
    "name": "María González",
    "email": "maria@empresa.com",
    "phone": "+52 55 1234 5678",
    "company_name": "Empresa ABC",
    "position": "Directora de Marketing",
    "notes": "Contacto desde formulario web"
  }
}`}
                  </pre>
                  <button
                    onClick={() => copyCode(`{
  "event": "contact",
  "data": {
    "name": "María González",
    "email": "maria@empresa.com",
    "phone": "+52 55 1234 5678",
    "company_name": "Empresa ABC",
    "position": "Directora de Marketing",
    "notes": "Contacto desde formulario web"
  }
}`, 'contact-example')}
                    className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    {copiedCode === 'contact-example' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>✨ Automágico:</strong> Si &quot;Empresa ABC&quot; no existe, se creará automáticamente
                    y el contacto se asociará a ella.
                  </p>
                </div>
              </div>

              {/* Opportunity Example */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Crear una Oportunidad</h3>
                <p className="text-slate-700 mb-4">
                  Perfecto para capturar leads interesados:
                </p>

                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto">
{`{
  "event": "opportunity",
  "data": {
    "contact_email": "maria@empresa.com",
    "title": "Interés en Plan Premium",
    "amount": 5000,
    "stage": "lead",
    "description": "Cliente potencial desde campaña Facebook"
  }
}`}
                  </pre>
                  <button
                    onClick={() => copyCode(`{
  "event": "opportunity",
  "data": {
    "contact_email": "maria@empresa.com",
    "title": "Interés en Plan Premium",
    "amount": 5000,
    "stage": "lead",
    "description": "Cliente potencial desde campaña Facebook"
  }
}`, 'opportunity-example')}
                    className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    {copiedCode === 'opportunity-example' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Company Example */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Registrar una Empresa</h3>
                <p className="text-slate-700 mb-4">
                  Agrega empresas desde cualquier fuente:
                </p>

                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto">
{`{
  "event": "company",
  "data": {
    "name": "Tech Startup XYZ",
    "website": "https://techstartup.com",
    "industry": "Tecnología",
    "address": "Av. Reforma 123, CDMX"
  }
}`}
                  </pre>
                  <button
                    onClick={() => copyCode(`{
  "event": "company",
  "data": {
    "name": "Tech Startup XYZ",
    "website": "https://techstartup.com",
    "industry": "Tecnología",
    "address": "Av. Reforma 123, CDMX"
  }
}`, 'company-example')}
                    className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    {copiedCode === 'company-example' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Integration Examples */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">🔌 Integraciones Populares</h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Zapier */}
                <div className="border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Zap className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Zapier</h3>
                  </div>
                  <ol className="space-y-2 text-sm text-slate-700">
                    <li>1. Crea un nuevo Zap</li>
                    <li>2. Selecciona tu trigger (ej: Google Forms)</li>
                    <li>3. Acción: &quot;Webhooks by Zapier&quot; → POST</li>
                    <li>4. Pega tu URL de webhook</li>
                    <li>5. Mapea los campos del formulario</li>
                  </ol>
                </div>

                {/* Make.com */}
                <div className="border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Make.com</h3>
                  </div>
                  <ol className="space-y-2 text-sm text-slate-700">
                    <li>1. Crea un nuevo escenario</li>
                    <li>2. Agrega tu trigger inicial</li>
                    <li>3. Módulo: &quot;HTTP&quot; → Make a request</li>
                    <li>4. URL: Tu webhook URL</li>
                    <li>5. Method: POST, Body type: JSON</li>
                  </ol>
                </div>

                {/* HTML Form */}
                <div className="border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Code className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Formulario HTML</h3>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">
                    Usa JavaScript para enviar datos desde tu sitio web:
                  </p>
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto">
{`fetch('TU_WEBHOOK_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event: 'contact',
    data: {
      name: formData.name,
      email: formData.email
    }
  })
})`}
                    </pre>
                  </div>
                </div>

                {/* Typeform */}
                <div className="border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Globe className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Typeform</h3>
                  </div>
                  <ol className="space-y-2 text-sm text-slate-700">
                    <li>1. Abre tu formulario en Typeform</li>
                    <li>2. Ve a Connect → Webhooks</li>
                    <li>3. Agrega tu URL de webhook</li>
                    <li>4. Selecciona &quot;Send on completion&quot;</li>
                    <li>5. Los datos llegarán automáticamente</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Security */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="h-6 w-6 text-slate-900" />
                <h2 className="text-2xl font-bold text-slate-900">Seguridad</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">🔐 Firma de Seguridad (Opcional)</h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    Para mayor seguridad, cada webhook incluye una clave secreta que puedes usar para validar
                    que las peticiones realmente vienen de fuentes confiables.
                  </p>
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-yellow-900 hover:text-yellow-700">
                      Ver ejemplo de validación →
                    </summary>
                    <pre className="mt-3 bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto">
{`// Node.js / JavaScript
const crypto = require('crypto')

const signature = crypto
  .createHmac('sha256', TU_SECRETO)
  .update(JSON.stringify(data))
  .digest('hex')

// Incluye en el request
{
  "event": "contact",
  "data": { ... },
  "signature": signature
}`}
                    </pre>
                  </details>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 text-green-600">✓</div>
                    <div>
                      <p className="font-medium text-slate-900">HTTPS Requerido</p>
                      <p className="text-sm text-slate-600">Todas las conexiones están encriptadas</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 text-green-600">✓</div>
                    <div>
                      <p className="font-medium text-slate-900">Logs Completos</p>
                      <p className="text-sm text-slate-600">Monitorea toda la actividad en tiempo real</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Outgoing Webhooks */}
        {activeTab === 'outgoing' && (
          <div className="space-y-12">
            {/* What is it */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">¿Qué son los Webhooks Salientes?</h2>
              <p className="text-lg text-slate-700 mb-4">
                Los webhooks salientes te permiten <strong>enviar automáticamente eventos de tu CRM</strong> a
                servicios externos. Cada vez que algo importante sucede en tu CRM (nueva venta, contacto creado, etc.),
                se notifica instantáneamente a los sistemas que elijas.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Notificaciones</h3>
                  <p className="text-sm text-slate-600">
                    Recibe alertas en Slack, Discord o email cuando cierras una venta
                  </p>
                </div>

                <div className="p-6 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg w-fit mb-3">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Sincronización</h3>
                  <p className="text-sm text-slate-600">
                    Mantén otros sistemas actualizados automáticamente con tus datos
                  </p>
                </div>

                <div className="p-6 bg-purple-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg w-fit mb-3">
                    <Globe className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Automatización</h3>
                  <p className="text-sm text-slate-600">
                    Dispara workflows complejos en plataformas externas
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Start */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">🚀 Inicio Rápido</h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">Obtén una URL de Destino</h3>
                    <p className="text-slate-700 mb-3">
                      Necesitas una URL donde enviar los eventos. Puedes usar:
                    </p>
                    <ul className="list-disc list-inside text-slate-600 space-y-1 text-sm">
                      <li>Webhook de Slack (para notificaciones)</li>
                      <li>URL de Make.com o Zapier</li>
                      <li>Tu propio servidor/API</li>
                      <li>Servicios como webhook.site (para pruebas)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">Crear el Webhook Saliente</h3>
                    <p className="text-slate-700 mb-3">
                      En <code className="px-2 py-1 bg-slate-100 rounded text-sm">Configuración → Webhooks</code>,
                      crea un webhook tipo &quot;Saliente&quot; y pega tu URL de destino.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">Selecciona los Eventos</h3>
                    <p className="text-slate-700 mb-3">
                      Elige qué eventos quieres enviar (ej: cuando se crea un contacto, cuando ganas una oportunidad).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">¡Listo! 🎉</h3>
                    <p className="text-slate-700">
                      Cada vez que ocurra uno de esos eventos, tu servicio externo recibirá los datos automáticamente.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Available Events */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">📡 Eventos Disponibles</h2>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { event: 'contact.created', desc: 'Nuevo contacto agregado al CRM', color: 'blue' },
                  { event: 'contact.updated', desc: 'Información de contacto actualizada', color: 'blue' },
                  { event: 'company.created', desc: 'Nueva empresa registrada', color: 'purple' },
                  { event: 'opportunity.created', desc: 'Nueva oportunidad de venta', color: 'green' },
                  { event: 'opportunity.won', desc: '¡Venta ganada! 🎉', color: 'green' },
                  { event: 'opportunity.lost', desc: 'Oportunidad perdida', color: 'red' },
                  { event: 'order.created', desc: 'Nueva orden generada', color: 'orange' },
                  { event: 'project.created', desc: 'Nuevo proyecto iniciado', color: 'indigo' },
                  { event: 'quote.created', desc: 'Cotización creada', color: 'yellow' },
                  { event: 'quote.sent', desc: 'Cotización enviada al cliente', color: 'yellow' },
                ].map(({ event, desc, color }) => (
                  <div key={event} className={`border-l-4 border-${color}-500 bg-slate-50 p-4 rounded-r`}>
                    <code className="text-sm font-mono text-slate-900">{event}</code>
                    <p className="text-sm text-slate-600 mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Payload Format */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">📦 Formato de los Datos</h2>

              <p className="text-slate-700 mb-4">
                Todos los webhooks salientes envían datos en este formato estándar:
              </p>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto">
{`{
  "event": "contact.created",
  "workspace_id": "uuid-del-workspace",
  "timestamp": "2025-11-07T10:30:00Z",
  "data": {
    "id": "uuid-del-contacto",
    "name": "María González",
    "email": "maria@empresa.com",
    "phone": "+52 55 1234 5678",
    "company_id": "uuid-de-empresa",
    "created_at": "2025-11-07T10:30:00Z"
    // ... más campos según el tipo de evento
  }
}`}
                </pre>
                <button
                  onClick={() => copyCode(`{
  "event": "contact.created",
  "workspace_id": "uuid-del-workspace",
  "timestamp": "2025-11-07T10:30:00Z",
  "data": {
    "id": "uuid-del-contacto",
    "name": "María González",
    "email": "maria@empresa.com",
    "phone": "+52 55 1234 5678",
    "company_id": "uuid-de-empresa",
    "created_at": "2025-11-07T10:30:00Z"
  }
}`, 'outgoing-format')}
                  className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  {copiedCode === 'outgoing-format' ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🔐 Headers de Seguridad</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Cada petición incluye estos headers para que puedas validar el origen:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 font-mono">
                  <li>• X-Webhook-Signature: firma HMAC SHA256</li>
                  <li>• X-Webhook-Event: nombre del evento</li>
                  <li>• X-Webhook-ID: ID del webhook</li>
                </ul>
              </div>
            </section>

            {/* Use Cases */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">💡 Casos de Uso Populares</h2>

              <div className="space-y-6">
                {/* Slack */}
                <div className="border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">💬</div>
                    <h3 className="text-lg font-semibold text-slate-900">Notificaciones en Slack</h3>
                  </div>
                  <p className="text-slate-700 mb-3">
                    Recibe una notificación en tu canal de Slack cada vez que ganes una venta:
                  </p>
                  <div className="bg-slate-50 p-4 rounded text-sm">
                    <p className="text-slate-600">1. Crea un Incoming Webhook en Slack</p>
                    <p className="text-slate-600">2. Configura un webhook saliente con ese URL</p>
                    <p className="text-slate-600">3. Suscríbete a <code className="bg-white px-2 py-0.5 rounded">opportunity.won</code></p>
                    <p className="text-slate-600">4. ¡Celebra cada venta en equipo! 🎉</p>
                  </div>
                </div>

                {/* Email Marketing */}
                <div className="border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">📧</div>
                    <h3 className="text-lg font-semibold text-slate-900">Sincronizar con Email Marketing</h3>
                  </div>
                  <p className="text-slate-700 mb-3">
                    Agrega automáticamente nuevos contactos a Mailchimp, SendGrid o ActiveCampaign:
                  </p>
                  <div className="bg-slate-50 p-4 rounded text-sm">
                    <p className="text-slate-600">1. Usa Make.com o Zapier como intermediario</p>
                    <p className="text-slate-600">2. Webhook saliente → Make.com → Mailchimp</p>
                    <p className="text-slate-600">3. Evento: <code className="bg-white px-2 py-0.5 rounded">contact.created</code></p>
                    <p className="text-slate-600">4. Tus listas siempre actualizadas ✓</p>
                  </div>
                </div>

                {/* Analytics */}
                <div className="border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">📊</div>
                    <h3 className="text-lg font-semibold text-slate-900">Analytics y Reportes</h3>
                  </div>
                  <p className="text-slate-700 mb-3">
                    Envía eventos a Google Analytics, Mixpanel o tu sistema de analytics:
                  </p>
                  <div className="bg-slate-50 p-4 rounded text-sm">
                    <p className="text-slate-600">• Rastrea conversiones desde lead hasta venta</p>
                    <p className="text-slate-600">• Mide ROI de campañas de marketing</p>
                    <p className="text-slate-600">• Crea dashboards personalizados</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Receiving Webhooks */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">👨‍💻 Para Desarrolladores</h2>

              <p className="text-slate-700 mb-4">
                Si quieres recibir webhooks en tu propio servidor, aquí un ejemplo básico:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Node.js / Express</h3>
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`const express = require('express')
const crypto = require('crypto')

app.post('/webhook', (req, res) => {
  // 1. Validar firma de seguridad
  const signature = req.headers['x-webhook-signature']
  const secret = process.env.WEBHOOK_SECRET

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex')

  if (signature !== expectedSig) {
    return res.status(401).send('Invalid signature')
  }

  // 2. Procesar el evento
  const { event, data } = req.body

  if (event === 'opportunity.won') {
    console.log('¡Nueva venta!', data.title, data.amount)
    // Enviar notificación, actualizar dashboard, etc.
  }

  // 3. Responder rápido
  res.json({ received: true })
})`}
                    </pre>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚡ Mejores Prácticas</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Responde rápido (en menos de 5 segundos)</li>
                    <li>• Procesa tareas pesadas de forma asíncrona</li>
                    <li>• Siempre valida la firma de seguridad</li>
                    <li>• Registra todos los eventos para debugging</li>
                    <li>• Maneja errores gracefully</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <section className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-3">¿Necesitas Ayuda?</h2>
            <p className="text-blue-100 mb-6">
              Nuestro equipo está listo para ayudarte a configurar tus webhooks
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="mailto:soporte@tucrm.com"
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Contactar Soporte
              </a>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors"
              >
                Volver Arriba ↑
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
