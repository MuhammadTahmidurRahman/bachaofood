# 🚀 Quick Start Guide - BachaoFood

## Step 1: Extract Files
Extract the `bachaofood` folder to your desired location.

## Step 2: Install Dependencies
```bash
cd bachaofood
npm install
```

## Step 3: Verify Supabase Setup
Your Supabase credentials are already configured in `.env` file:
- URL: https://lrexsowzgvyypvgquaim.supabase.co
- Key: Already set

## Step 4: Run Database Schema
1. Go to https://supabase.com and login
2. Open your project
3. Click "SQL Editor" in left sidebar
4. Click "New query"
5. Copy ALL content from `supabase-schema.sql`
6. Paste and click "Run"

## Step 5: Create Storage Bucket
1. In Supabase, click "Storage" in left sidebar
2. Click "Create a new bucket"
3. Name: `food-images` (exactly this!)
4. Check "Public bucket" ✅
5. Click "Create bucket"

## Step 6: Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## Step 7: Test the App
1. Click "Get Started"
2. Fill in registration form
3. Login and explore!

## 🎯 Features to Test

✅ Register new account
✅ Login/Logout
✅ Update profile
✅ Add food logs
✅ Manage inventory (add/edit/delete)
✅ Browse resources
✅ Upload images (drag & drop)
✅ View dashboard statistics

## 🛠️ If Something Goes Wrong

**Can't install packages?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Server won't start?**
- Check if port 3000 is available
- Try: `npm run dev -- --port 3001`

**Database errors?**
- Make sure you ran the SQL schema
- Check Supabase credentials in `.env`

**Upload not working?**
- Verify `food-images` bucket exists
- Make sure it's set to PUBLIC

## 📦 Build for Production
```bash
npm run build
```

Output will be in `dist/` folder.

## 🚀 Deploy to Netlify
1. Push to GitHub
2. Connect to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables from `.env`

---

**Need Help?** Check README.md for detailed documentation.

**Good luck! 🎉**
