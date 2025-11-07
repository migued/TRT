import Link from 'next/link'
import { ArrowRight, Users, TrendingUp, MessageSquare, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <span className="text-xl font-bold text-slate-900">TRT Platform</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Comenzar gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Organiza tu negocio,
            <br />
            <span className="text-slate-600">crece más rápido</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            La plataforma todo-en-uno para pequeñas y medianas empresas en LATAM.
            CRM, ventas, proyectos, finanzas y WhatsApp en un solo lugar.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-base font-medium text-white hover:bg-slate-800"
            >
              Comenzar gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Iniciar sesión
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Sin tarjeta de crédito • 14 días gratis • Cancela cuando quieras
          </p>
        </section>

        {/* Features Section */}
        <section className="border-t border-slate-200 bg-slate-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold text-slate-900">
              Todo lo que necesitas para crecer
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Feature
                icon={<Users className="h-6 w-6" />}
                title="CRM Inteligente"
                description="Gestiona contactos, empresas y oportunidades de venta en un solo lugar."
              />
              <Feature
                icon={<TrendingUp className="h-6 w-6" />}
                title="Pipeline Visual"
                description="Visualiza tu proceso de ventas con kanban boards intuitivos."
              />
              <Feature
                icon={<MessageSquare className="h-6 w-6" />}
                title="WhatsApp Integrado"
                description="Toda tu comunicación de negocio centralizada y organizada."
              />
              <Feature
                icon={<Zap className="h-6 w-6" />}
                title="IA Automática"
                description="Asistente inteligente que automatiza tareas repetitivas."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            ¿Listo para organizar tu negocio?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Únete a cientos de empresas que ya confían en TRT Platform
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-lg font-medium text-white hover:bg-slate-800"
            >
              Comenzar ahora gratis
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600">
          <p>© 2025 TRT Platform. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  )
}
