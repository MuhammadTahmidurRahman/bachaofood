```md
# 🍽️ BachaoFood  
Smart Food Management for Sustainability  

BachaoFood is a full-featured food management system designed to reduce food waste, track consumption, and support UN SDG goals (Zero Hunger & Responsible Consumption).  
This project includes inventory tracking, food logging, smart insights, recommendations, and interactive dashboards powered by **React**, **Supabase**, **TailwindCSS**, **Framer Motion**, and **Recharts**.

---

## 🚀 Features

### ✅ **User Authentication**
- Secure login & registration via Supabase Auth  
- Protected routes & global user context  

### 🧺 **Inventory Management**
- Add/edit/delete inventory items  
- Auto quantity tracking  
- Expiry countdown indicators  
- Smart food picker (preloaded food items)  
- Filtering by category  
- Clean UI with animations  

### 📝 **Food Logging System**
- Log consumption of food items  
- Quantity auto-deducted from inventory (FIFO by expiry date)  
- Deletion reverts quantity back to inventory  
- Inventory-linked dropdown for quick log entry  

### 📊 **Smart Dashboard**
- Inventory statistics  
- Recent activity  
- Category distribution charts (PieChart)  
- Personalized recommendations based on user logs  
- Budget range display  
- Animated UI with framer-motion  

### 📍 **Location Search**
- LocationIQ-powered autocomplete  
- Reusable component for city/town search  

### 🌏 **Sustainability Focus**
- SDG 2: Zero Hunger  
- SDG 12: Responsible Consumption & Production  
- Insight-driven prompts for reducing waste  

---

## 🛠️ Tech Stack

### **Frontend**
- React (Vite)  
- TailwindCSS  
- Framer Motion  
- Recharts  
- Lucide Icons  
- React Router  

### **Backend**
- Supabase (Authentication + PostgreSQL Database)  
- Custom SQL schema  
- Supabase client helpers  

---

## 📂 Project Structure

```

bachaofood/
├── src/
│   ├── components/
│   │   └── Layout.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   └── aiService.js
│   │   └── supabase.js
|   |   └──receiptParser.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── FoodLogs.jsx
│   │   ├── FreeLocationInput.jsx
│   │   ├── Inventory.jsx
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Resources.jsx
│   │   ├── AIDashboard.jsx
│   │   ├── MealOptimizer.jsx
│   │   ├── NourishBot.jsx
│   │   └── Upload.jsx
│   ├── utils/
│   │   ├── ocr.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css

├── supabase-schema.sql
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env

````

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the repository  
```sh
git clone https://github.com/MuhammadTahmidurRahman/bachaofood.git
cd bachaofood
````

### 2️⃣ Install dependencies

```sh
npm install
```

### 3️⃣ Configure environment variables

Create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LOCATIONIQ_TOKEN=your_locationiq_api_key
```

### 4️⃣ Run the development server

```sh
npm run dev
```

---

## 🗄️ Database Schema

All SQL tables and definitions are included in:

```
supabase-schema.sql
```

---

## 📸 Screens & UI Highlights

* Animated Landing Page with 3D rotating logo
* Modern dashboard with charts & recommendations
* Inventory cards with expiry indicators
* Smooth modal transitions for food picker
* Clean, minimalist UI with glassmorphism

---

## 🤝 Contributors

* **Muhammad Tahmidur Rahman**
* **Anika Tabassum**
* **Mohosina Islam Disha**

---

## 📄 License

MIT © 2025
Muhammad Tahmidur Rahman
Anika Tabassum
Mohosina Islam Disha

```
```
