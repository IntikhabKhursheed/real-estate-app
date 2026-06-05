# EstateIQ 🏠
### AI-Powered Real Estate Platform for Pakistan & Middle East

![Status](https://img.shields.io/badge/Status-Live-success)
![Stack](https://img.shields.io/badge/Stack-MEAN-blue)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-orange)

EstateIQ is a production-grade AI real estate platform built for Pakistan and Middle East. It combines traditional property listings with **Google Gemini AI** for valuation, search, and investment insights.

---

## 🤖 AI Features

| Feature | Description |
|---|---|
| Property Valuation | Enter details → AI estimates fair market value instantly |
| Natural Language Search | Search in plain English — "3 bed apartment near metro under 1.5M" |
| Investment Score | AI rates each property 0–100 with detailed reasoning |
| Market Intelligence | AI analyzes area trends & investment potential |

---

## ✨ Key Features

- **Property Listings** — Full CRUD with images, location, and details  
- **Advanced Filters** — Type, purpose, price, bedrooms, city, area  
- **Agent Dashboard** — Track listings & analytics  
- **Mortgage Calculator** — Estimate monthly payments for Pakistan market  
- **Authentication** — JWT with role-based access (Admin / Agent / User)  
- **Dark/Light Mode** — Fully responsive UI  
- **Real-Time Updates** — Property availability status

---

## 🛠️ Tech Stack

**Frontend**
- Angular 19 (Standalone Components)
- Tailwind CSS
- RxJS + BehaviorSubject
- Angular HTTP Interceptor for JWT

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt password hashing

**AI & Services**
- Google Gemini AI — valuation, search, investment scoring
- Cloudinary — image uploads
- Vercel — deployment

---

## 👥 User Roles

| Role | Access |
|---|---|
| Admin | Full access, manage all listings & users |
| Agent | Manage own listings & dashboard |
| User | Browse properties, use AI features, save favorites |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Google Gemini API key

### Installation

```bash
# Clone repo
git clone https://github.com/IntikhabKhursheed/real-estate-app.git
cd real-estate-app

# Install server dependencies
cd server
npm install

# Install frontend dependencies
cd ../frontend
npm install
