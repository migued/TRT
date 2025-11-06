# TRT Platform

> All-in-one business management platform for LATAM SMBs

**TRT Platform** combines CRM, sales pipeline management, project management, financial tracking, WhatsApp integration, and AI-powered automation designed specifically for small and medium businesses in Latin America.

## 🚀 Vision

"To be the operating system for LATAM SMBs, where every business conversation, customer, project, and peso is organized, visible, and actionable."

## ✨ Key Features

### Phase 0: Foundation (Current)
- ✅ Next.js 14 with App Router
- ✅ TypeScript + Tailwind CSS
- ✅ Supabase (PostgreSQL + Auth + Storage)
- ✅ Multi-tenancy with Row Level Security
- ✅ Base database schema with migrations

### Phase 1: MVP Core (In Progress)
- [ ] **CRM** - Contacts & Companies management
- [ ] **Sales Pipeline** - Opportunities with drag-and-drop
- [ ] **Products Catalog** - Reusable products/services
- [ ] **Quotes** - Professional proposals with e-signatures
- [ ] **Orders** - Confirmed sales with financial tracking
- [ ] **Projects** - Delivery management with tasks
- [ ] **Financial Tracking** - Income/expense per order/project
- [ ] **Workspaces** - Complete multi-tenancy system

### Phase 2: Communication & AI
- [ ] WhatsApp Cloud API integration
- [ ] AI Assistant (Claude API)
- [ ] Email integration (SMTP/IMAP)
- [ ] Re-engagement campaigns
- [ ] Templates system

### Phase 3: Collaboration
- [ ] Webhooks (in/out)
- [ ] Team management
- [ ] Public client portal
- [ ] Knowledge base
- [ ] Notifications

### Phase 4: Enterprise
- [ ] White label & custom domains
- [ ] BYO Supabase
- [ ] Payment links (Stripe/MercadoPago)
- [ ] Electronic invoicing (Alegra - CFDI)
- [ ] POS system
- [ ] Contract signatures

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State:** React Context + Zustand
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Charts:** Recharts

### Backend
- **Runtime:** Node.js 18+
- **API:** Next.js API Routes (serverless)
- **Hosting:** Vercel

### Database & Auth
- **Database:** Supabase (PostgreSQL 15)
- **Auth:** Supabase Auth (JWT)
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime

### AI & Integrations
- **AI:** Claude API (Anthropic)
- **WhatsApp:** WhatsApp Cloud API (Meta)
- **Email:** Resend + Nodemailer
- **Payments:** Stripe, MercadoPago
- **Invoicing:** Alegra API

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TRT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in your Supabase credentials and other API keys in `.env`

4. **Set up Supabase**

   a. Create a new Supabase project at https://supabase.com

   b. Run the migration script:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Paste the content of `supabase/migrations/001_initial_schema.sql`
   - Execute the script

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to http://localhost:3000

## 📁 Project Structure

```
TRT/
├── src/
│   ├── app/                  # Next.js 14 App Router
│   │   ├── (auth)/          # Authentication routes
│   │   ├── (dashboard)/     # Main app routes
│   │   ├── api/             # API routes
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── contacts/       # Contact components
│   │   ├── opportunities/  # Opportunity components
│   │   └── ...
│   ├── lib/                # Utilities
│   │   ├── supabase/       # Supabase clients
│   │   └── utils.ts        # Helper functions
│   ├── types/              # TypeScript types
│   │   └── database.ts     # Database types
│   ├── hooks/              # React hooks
│   ├── store/              # Zustand stores
│   └── middleware.ts       # Next.js middleware
├── supabase/
│   └── migrations/         # Database migrations
├── public/                 # Static files
├── .env.example           # Environment variables template
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

## 🗄️ Database Schema

The platform uses a multi-tenant architecture with Row Level Security (RLS):

### Core Tables
- `workspaces` - Tenant root (one per business)
- `profiles` - Users in workspaces
- `contacts` - Customer contacts
- `companies` - Customer companies
- `opportunities` - Sales pipeline
- `products` - Product/service catalog
- `quotes` - Professional proposals
- `orders` - Confirmed sales
- `projects` - Delivery management
- `tasks` - Task management
- `transactions` - Financial records

See `supabase/migrations/001_initial_schema.sql` for complete schema.

## 🔐 Multi-Tenancy & Security

- **Row Level Security (RLS)** - All data isolated at PostgreSQL level
- **JWT Authentication** - Supabase Auth with secure cookies
- **Workspace Isolation** - Users only see their workspace data
- **Role-Based Access** - Owner, Admin, Member roles
- **API Security** - Rate limiting, CORS, input validation

## 🌍 Localization

The platform is designed for LATAM markets:

- **Languages:** Spanish (primary), Portuguese (planned)
- **Currency Support:** MXN, USD, ARS, BRL, COP
- **Payment Methods:** OXXO, SPEI, MercadoPago, Stripe
- **Electronic Invoicing:** CFDI for Mexico (via Alegra)

## 📝 Development Phases

### Phase 0: Foundation ✅
Setup core infrastructure and architecture

### Phase 1: MVP Core (Current)
Build essential features: CRM, Sales, Projects, Financials

### Phase 2: Communication & AI
Integrate WhatsApp, Email, and AI assistant

### Phase 3: Collaboration
Add team features, webhooks, client portal

### Phase 4: Enterprise
White label, custom infrastructure, advanced integrations

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Anthropic Claude](https://www.anthropic.com/)

---

**Status:** Phase 0 Complete - Foundation Ready ✅

**Next Steps:** Begin Phase 1 MVP Core implementation
