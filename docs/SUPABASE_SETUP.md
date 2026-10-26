# 🚀 Supabase Integration Setup Guide

Your ShaadiBazaar app now has **Supabase integration** with **Zod validation** and **enhanced type safety**! Here's how to set it up:

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js 18+**: Already installed ✅
3. **Expo CLI**: Already available ✅

## 🛠️ Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name (e.g., "shaadi-bazaar")
3. Set a strong database password
4. Select a region close to your users

### 2. Get Your Credentials

From your Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon/public key**

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Create Database Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  wedding_date TIMESTAMPTZ,
  partner_name TEXT,
  partner_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendors table
CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  price_range TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  completed_bookings INTEGER DEFAULT 0,
  gallery TEXT[] DEFAULT '{}',
  contact JSONB NOT NULL,
  features JSONB[] DEFAULT '{}',
  services JSONB[] DEFAULT '{}',
  packages JSONB[] DEFAULT '{}',
  availability BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create checklist_items table
CREATE TABLE checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budget_items table
CREATE TABLE budget_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  estimated DECIMAL(10,2) NOT NULL DEFAULT 0,
  spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budget_expenses table
CREATE TABLE budget_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_item_id UUID REFERENCES budget_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  paid BOOLEAN DEFAULT false,
  vendor TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wedding_details table
CREATE TABLE wedding_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_name TEXT NOT NULL,
  wedding_date TIMESTAMPTZ NOT NULL,
  wedding_location TEXT NOT NULL,
  total_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create favorite_vendors table
CREATE TABLE favorite_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_id)
);
```

### 5. Set Up Row Level Security (RLS)

```sql
-- Profiles RLS
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Checklist RLS
CREATE POLICY "Users can manage own checklist" ON checklist_items
  FOR ALL USING (auth.uid() = user_id);

-- Budget RLS
CREATE POLICY "Users can manage own budget" ON budget_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own expenses" ON budget_expenses
  FOR ALL USING (auth.uid() = user_id);

-- Wedding details RLS
CREATE POLICY "Users can manage own wedding details" ON wedding_details
  FOR ALL USING (auth.uid() = user_id);

-- Favorite vendors RLS
CREATE POLICY "Users can manage own favorites" ON favorite_vendors
  FOR ALL USING (auth.uid() = user_id);

-- Vendors RLS (public read, authenticated write)
CREATE POLICY "Anyone can view vendors" ON vendors
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage vendors" ON vendors
  FOR ALL USING (auth.role() = 'authenticated');
```

### 6. Enable Real-time (Optional)

In Supabase dashboard:
1. Go to **Database** → **Replication**
2. Enable real-time for these tables:
   - `checklist_items`
   - `budget_items`
   - `budget_expenses`
   - `wedding_details`

## 🎯 What's New

### ✅ Enhanced Type Safety
- **Zod schemas** for runtime validation
- **Strict TypeScript types** for all data
- **Component prop validation**

### ✅ Real-time Features
- **Live checklist updates** between devices
- **Real-time budget tracking**
- **Collaborative wedding planning**

### ✅ Improved Persistence
- **Selective state persistence** (only important data)
- **Error handling** for storage operations
- **Automatic data synchronization**

### ✅ Better Authentication
- **Supabase Auth** with email/password
- **Profile management**
- **Secure user sessions**

## 🧪 Testing

1. **Start your app**: `npm start`
2. **Create an account** in the app
3. **Add checklist items** and see real-time updates
4. **Test budget tracking** with expenses
5. **Try vendor favorites** functionality

## 🔧 Development Tips

- **Mock data fallback**: App works without Supabase (uses mock data)
- **Error handling**: All operations return `{ success, error }` objects
- **Type validation**: Zod validates all data at runtime
- **Real-time**: Subscribe/unsubscribe automatically

## 📱 Production Deployment

1. **Environment variables**: Set in your deployment platform
2. **Database backups**: Enable in Supabase dashboard
3. **Monitoring**: Use Supabase analytics
4. **Scaling**: Supabase handles automatically

Your wedding planning app is now production-ready with real-time collaboration! 🎉
