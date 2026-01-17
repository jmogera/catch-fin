# Supabase Setup Guide

This guide will help you set up Supabase for your personal finance application.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Your project name (e.g., "catch-fin")
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region
5. Click "Create new project"
6. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Copy the entire SQL script
4. Paste it into the SQL Editor
5. Click "Run" to execute the script

This will create:
- `accounts` table with RLS policies
- `transactions` table with RLS policies
- Indexes for better performance
- Triggers for automatic `updated_at` timestamps

## Step 5: Verify Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see two tables: `accounts` and `transactions`
3. Check that Row Level Security (RLS) is enabled on both tables

## Step 6: Test the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The app will use a mock user ID stored in localStorage for development
3. Try creating an account and transaction to verify everything works

## Authentication (Optional - For Later)

Currently, the app uses a mock user ID. To add real authentication:

1. In Supabase, go to **Authentication** → **Providers**
2. Enable the authentication method you want (Email, Google, etc.)
3. Update `src/hooks/use-user-id.ts` to use Supabase auth:
   ```typescript
   import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
   
   export function useUserId() {
     const { user } = useSupabaseAuth()
     return user?.id
   }
   ```

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure `.env` file exists and has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after adding environment variables

### Error: "relation does not exist"
- Make sure you ran the SQL schema script in Step 4
- Check that tables exist in the Table Editor

### Data not showing up
- Check browser console for errors
- Verify RLS policies are set up correctly
- Make sure you're using the correct user ID

## Next Steps

- [ ] Add CSV parsing for transaction imports
- [ ] Implement real authentication with Supabase Auth
- [ ] Add data validation and error handling
- [ ] Set up database backups
- [ ] Add real-time subscriptions for live updates
