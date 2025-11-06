# TRT Platform - Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ Git installed
- ✅ A Supabase account (free tier is fine)
- ✅ A code editor (VS Code recommended)

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- Supabase client libraries
- Tailwind CSS
- shadcn/ui components
- TypeScript and type definitions

### Step 2: Set Up Supabase Project

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose an organization (or create one)
   - Enter project details:
     - Name: `trt-platform` (or your choice)
     - Database Password: (save this somewhere safe)
     - Region: Choose closest to your users
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

2. **Get Your Supabase Credentials**
   - Once the project is ready, go to Project Settings (⚙️ icon)
   - Navigate to "API" section
   - Copy these values:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon public key** (starts with `eyJhb...`)
     - **service_role key** (starts with `eyJhb...`) - Keep this secret!

3. **Run Database Migrations**
   - In your Supabase dashboard, go to "SQL Editor"
   - Click "New Query"
   - Open `supabase/migrations/001_initial_schema.sql` from this project
   - Copy the entire content
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for confirmation: "Success. No rows returned"

   ✅ Your database schema is now set up with all tables, indexes, and RLS policies!

### Step 3: Configure Environment Variables

1. **Copy the example file**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your credentials**

   Open `.env` and update:

   ```bash
   # Supabase (from Step 2)
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
   SUPABASE_SERVICE_ROLE_KEY=eyJhb...

   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Leave these empty for now (Phase 2+)
   ANTHROPIC_API_KEY=
   WHATSAPP_APP_ID=
   WHATSAPP_APP_SECRET=
   STRIPE_SECRET_KEY=
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   ```

3. **Save the file**

   ⚠️ **Important:** Never commit `.env` to git! It's in `.gitignore`.

### Step 4: Install shadcn/ui Components (Optional)

We'll add components as needed, but to get started with a few base components:

```bash
# Install base components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
```

This will create components in `src/components/ui/`.

### Step 5: Run the Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Environments: .env

✓ Ready in 2.5s
```

### Step 6: Verify Everything Works

1. **Open your browser**
   - Navigate to http://localhost:3000
   - You should see the TRT Platform landing page

2. **Check Supabase connection**
   - Open browser DevTools (F12)
   - Go to Console tab
   - There should be no errors about Supabase

3. **Test the build**
   ```bash
   npm run build
   ```
   This should complete without errors.

## ✅ Setup Complete!

You now have:
- ✅ Next.js 14 app running
- ✅ Supabase connected and configured
- ✅ Database schema deployed
- ✅ Environment variables set
- ✅ Development environment ready

## 🎯 Next Steps

Choose your path:

### Option A: Follow the Tutorial (Recommended for learning)
Continue with the feature implementation guides in order:
1. Authentication system
2. CRM - Contacts management
3. Sales Pipeline - Opportunities
4. And so on...

### Option B: Start Building (For experienced developers)
Jump to any feature you want to implement:
- See `docs/features/` for individual feature guides
- Check the PRD documents for detailed specifications

### Option C: Explore the Codebase
- `src/app/` - Page routes and layouts
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and helpers
- `supabase/migrations/` - Database schema

## 🐛 Troubleshooting

### Issue: "Cannot find module '@supabase/ssr'"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Error: supabase_url is required"

**Solution:** Check that your `.env` file exists and has the correct values. Restart the dev server after changing .env:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Issue: Database migration failed

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Check for error messages
3. Common issue: Extensions not enabled
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   ```
4. Try running migration again

### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or run on different port
npm run dev -- -p 3001
```

## 📚 Useful Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run type-check    # Check TypeScript types

# Supabase (once you have CLI installed)
npx supabase start    # Start local Supabase
npx supabase status   # Check Supabase status
npx supabase db reset # Reset local database
```

## 🆘 Getting Help

If you're stuck:

1. Check the troubleshooting section above
2. Review the main README.md
3. Check Supabase logs in dashboard
4. Review browser console for errors
5. Contact the development team

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Ready to build!** 🚀

Your development environment is set up and ready. Start with Phase 1 MVP Core features.
