# 🌿 BachaoFood - Smart Food Management Platform

A modern full-stack web application supporting UN SDG 2 (Zero Hunger) and SDG 12 (Responsible Consumption) through intelligent food tracking and sustainability features.

## 🎯 Project Overview

BachaoFood helps individuals and communities reduce food waste, manage inventories, and make sustainable food choices through an intuitive interface with real-time tracking and smart recommendations.

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS + Framer Motion
- **Backend/Database**: Supabase (PostgreSQL + Authentication + Storage)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Utilities**: date-fns

## ✨ Features Implemented

✅ **Authentication & User Management**
- Email/password registration and login
- Form validation
- User profiles with dietary preferences and budget settings

✅ **User Profile & Consumption Logging**
- Editable profile page
- Manual food logging
- Consumption history tracking

✅ **Food Items & Inventory Management**
- Seeded database with 20+ food items
- CRUD operations for inventory
- Expiry date tracking with visual alerts
- Category filtering

✅ **Resources for Sustainability**
- 20+ curated resources
- Smart recommendations
- Category-based filtering

✅ **Basic Tracking Logic**
- Dashboard with statistics
- Category distribution charts
- Recent activity timeline

✅ **Image Upload Interface**
- Drag-and-drop file upload
- Support for JPG/PNG images

✅ **User Dashboard & UI**
- Responsive glass-morphism design
- Smooth animations
- Mobile-friendly navigation

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

1. Create account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to Project Settings > API
4. Copy your project URL and anon public key

### 3. Database Setup

1. In Supabase dashboard, go to SQL Editor
2. Copy content from `supabase-schema.sql`
3. Paste and run in SQL Editor

### 4. Storage Setup

1. Go to Storage in Supabase dashboard
2. Create bucket called `food-images`
3. Set it to **Public**

### 5. Environment Configuration

The `.env` file is already configured with your credentials:
```
VITE_SUPABASE_URL=https://lrexsowzgvyypvgquaim.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
bachaofood/
├── src/
│   ├── components/
│   │   └── Layout.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── FoodLogs.jsx
│   │   ├──  FreeLocationInput.jsx
│   │   ├── Inventory.jsx
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── Profile.jsx
│   │   ├── Register.jsx
│   │   ├── Resources.jsx
│   │   └── Upload.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase-schema.sql
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env
```

## 🛠 Troubleshooting

**Database errors?**
- Verify `.env` credentials
- Check Supabase dashboard for SQL errors
- Ensure Row Level Security policies are active

**Upload not working?**
- Confirm `food-images` bucket exists
- Set bucket to public
- Check browser console for errors

**Build errors?**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm run build -- --force`

## 🎯 All Requirements Met

✅ Authentication (email/password with validation)
✅ User Profile (editable with all required fields)
✅ Food Items Database (20+ items seeded)
✅ Resources Database (20+ resources seeded)
✅ Basic Tracking Logic (dashboard with stats and recommendations)
✅ Image Upload (drag-and-drop interface)
✅ User Dashboard (responsive with charts)
✅ Code Quality (modular, clean, documented)

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 📄 License

MIT License

## 👏 Acknowledgments

Built for INNOVATEX Hackathon with modern web technologies and sustainable design principles.

---

**Good luck with your hackathon! 🚀**
