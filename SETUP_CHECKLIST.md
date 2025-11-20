# ✅ Setup Verification Checklist

Use this checklist to ensure everything is set up correctly.

## Pre-Installation Checks
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Have Supabase account

## Installation Steps
- [ ] Extracted bachaofood folder
- [ ] Opened terminal in bachaofood directory
- [ ] Ran `npm install` successfully
- [ ] No errors during installation

## Supabase Configuration
- [ ] Logged into Supabase dashboard
- [ ] Located your project
- [ ] Ran SQL schema from `supabase-schema.sql`
- [ ] Verified 6 tables created (profiles, food_logs, inventory, food_items, resources, uploads)
- [ ] Verified food_items has 20 rows
- [ ] Verified resources has 20 rows

## Storage Setup
- [ ] Created bucket named `food-images`
- [ ] Set bucket to PUBLIC
- [ ] Bucket shows in Storage section

## Environment Variables
- [ ] `.env` file exists in root
- [ ] VITE_SUPABASE_URL is set
- [ ] VITE_SUPABASE_ANON_KEY is set

## First Run
- [ ] Ran `npm run dev`
- [ ] Server started on port 3000
- [ ] Browser opened to http://localhost:3000
- [ ] Landing page loads correctly
- [ ] No console errors

## Registration Test
- [ ] Clicked "Get Started"
- [ ] Filled registration form:
  - Full name
  - Email
  - Password (min 6 chars)
  - Confirm password
  - Location
  - Household size
  - Dietary preference
  - Budget range
- [ ] Form submitted successfully
- [ ] Redirected to Dashboard

## Feature Tests
- [ ] Dashboard shows welcome message
- [ ] Can navigate to all pages
- [ ] Profile page shows user info
- [ ] Can edit and save profile
- [ ] Can add food log
- [ ] Can add inventory item
- [ ] Can view resources
- [ ] Can upload image (drag & drop)
- [ ] Can logout and login again

## Common Issues & Solutions

### npm install fails
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use
```bash
# Use different port
npm run dev -- --port 3001
```

### Database connection error
- Check `.env` file has correct credentials
- Verify Supabase project is active
- Check you copied the ANON key, not service_role key

### Upload fails
- Bucket must be named exactly `food-images`
- Bucket must be PUBLIC (not restricted)
- Check Storage > Policies if needed

### SQL schema errors
- Run schema again
- Check for existing tables (delete if needed)
- Ensure you're in correct project

## Success Indicators

✅ All pages load without errors
✅ Can register and login
✅ Can perform CRUD operations
✅ Images upload successfully
✅ No console errors
✅ Dashboard shows statistics
✅ Resources display correctly

## Next Steps After Verification

1. **Development**: Continue building features
2. **Testing**: Test all user flows
3. **Deployment**: Use `npm run build` for production
4. **Presentation**: Prepare demo for hackathon

## Need Help?

- Check README.md for detailed docs
- Check QUICK_START.md for step-by-step
- Review console errors in browser
- Check Supabase logs in dashboard

---

**If all items are checked, you're ready to go! 🎉**
