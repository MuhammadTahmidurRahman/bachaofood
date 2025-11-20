# 📊 SUPABASE SETUP - Step by Step

## Why Supabase?
- ✅ **100% FREE** (generous free tier, no credit card needed)
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 50,000 monthly active users
- ✅ Built-in authentication
- ✅ Real-time subscriptions
- ✅ No limits on API requests in free tier

## Complete Setup Guide

### Step 1: Create Account (30 seconds)
1. Visit https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (fastest) or email
4. Verify email if needed

### Step 2: Create Project (2 minutes)
1. Click "New Project"
2. Choose organization (create one if first time)
3. Fill in:
   - **Name**: FoodWise-Hackathon
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
4. Click "Create new project"
5. **Wait ~2 minutes** for database to spin up

### Step 3: Setup Database Schema (1 minute)
1. Click **"SQL Editor"** in left sidebar
2. Click **"New query"**
3. Open the file `supabase-schema.sql` from the project
4. **Copy ALL content** (entire file)
5. **Paste** into SQL Editor
6. Click **"Run"** (bottom right)
7. You should see: "Success. No rows returned"

✅ This creates:
- 6 tables (profiles, food_logs, inventory, food_items, resources, uploads)
- Row Level Security policies
- 20 food items (seeded data)
- 20 resources (seeded data)

### Step 4: Setup Storage (30 seconds)
1. Click **"Storage"** in left sidebar
2. Click **"Create a new bucket"**
3. Bucket details:
   - **Name**: `food-images` (exactly this name!)
   - **Public bucket**: ✅ **CHECK THIS BOX** (very important!)
4. Click "Create bucket"

### Step 5: Get API Credentials (30 seconds)
1. Click **"Settings"** (gear icon) in left sidebar
2. Click **"API"**
3. You'll see two important values:

**Project URL** (looks like):
```
https://abcdefghijklmnop.supabase.co
```

**anon public** key (looks like):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjU0NTU1NSwiZXhwIjoxOTI4MTIxNTU1fQ.abc123xyz789
```

4. **Copy both** - you'll need these!

### Step 6: Configure Your App (1 minute)
1. Open project folder
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and paste your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
   ```
4. Save the file

### Step 7: Verify Setup (1 minute)
Run the app:
```bash
npm install
npm run dev
```

Visit http://localhost:3000

1. Click "Get Started" 
2. Register with email/password
3. If you can create account → **SUCCESS!** ✅

## Verification Checklist

After setup, verify in Supabase dashboard:

### Database Tables ✅
Click **"Table Editor"** - you should see:
- profiles (empty - will fill when users register)
- food_logs (empty)
- inventory (empty)
- food_items (**20 rows** - pre-seeded)
- resources (**20 rows** - pre-seeded)
- uploads (empty)

### Storage Bucket ✅
Click **"Storage"** - you should see:
- food-images (public) ✅

### Authentication ✅
Click **"Authentication"** > **"Users"**
- Should be empty initially
- Will show users after registration

## Common Issues & Fixes

### ❌ "Failed to create profile"
**Cause**: SQL schema not run properly
**Fix**: 
1. Go to SQL Editor
2. Re-paste entire `supabase-schema.sql`
3. Run again

### ❌ "Upload failed"
**Cause**: Storage bucket not public
**Fix**:
1. Go to Storage
2. Click on `food-images` bucket
3. Click "Settings"
4. Make sure "Public bucket" is checked

### ❌ "Invalid API credentials"
**Cause**: Wrong keys in .env
**Fix**:
1. Go to Settings > API in Supabase
2. Copy **anon public** key (not service_role!)
3. Copy **Project URL**
4. Update .env file
5. Restart dev server

### ❌ Row Level Security errors
**Cause**: RLS policies not created
**Fix**: The SQL file creates these automatically. If issues:
1. Go to Authentication > Policies
2. Each table should have 2-3 policies
3. Re-run SQL if missing

## Testing Database

Want to verify data manually?

1. **Check seeded food items**:
   ```sql
   SELECT * FROM food_items;
   ```
   Should return 20 rows

2. **Check seeded resources**:
   ```sql
   SELECT * FROM resources;
   ```
   Should return 20 rows

3. **After registration, check profile**:
   ```sql
   SELECT * FROM profiles;
   ```
   Should show your profile

## Free Tier Limits

You get:
- **Database**: 500 MB (enough for 10,000+ users)
- **Storage**: 1 GB (thousands of images)
- **Bandwidth**: 5 GB/month
- **API Requests**: Unlimited!
- **Active Users**: 50,000/month

This is MORE than enough for:
- ✅ Hackathon demo
- ✅ Testing phase
- ✅ Initial production
- ✅ Multiple team members

## Netlify + Supabase

When deploying to Netlify:

1. In Netlify dashboard
2. Go to Site settings > Environment variables
3. Add:
   - `VITE_SUPABASE_URL` = your URL
   - `VITE_SUPABASE_ANON_KEY` = your key
4. Redeploy

## Security Notes

✅ **Safe to commit**:
- Project URL
- anon public key

❌ **NEVER commit**:
- Database password
- service_role key
- .env file (already in .gitignore)

The anon key is meant to be public - it only allows what your RLS policies permit.

## Backup Your Credentials

Save these somewhere safe:
1. Supabase Project URL
2. Supabase anon public key
3. Database password (from Step 2)

You'll need them if you:
- Deploy to Netlify
- Share with team
- Setup on another machine

## Support

Need help?
- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Status: https://status.supabase.com

## Done! 🎉

Your Supabase backend is now:
- ✅ Fully configured
- ✅ Seeded with data
- ✅ Ready for production
- ✅ Connected to your app
- ✅ 100% free forever (within limits)

Now go build amazing features and win that hackathon! 🚀
