# EstateIQ - Running Backend & Frontend Together

## ✅ Quick Start (3 Ways)

### Option 1: Using npm command (Recommended)
From the root directory (`d:\Programming\real-estate-app`):

```bash
npm run dev:all
```

This uses `concurrently` to run both apps side-by-side with color-coded output.

---

### Option 2: Using Windows Batch File (Easy for Windows users)

Double-click the file in File Explorer:
```
d:\Programming\real-estate-app\start-all.bat
```

This opens 2 command windows:
- One for Backend (port 5000)
- One for Frontend (port 4200)

---

### Option 3: Using PowerShell Script (Advanced)

```powershell
# Set execution policy if needed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Run the script
d:\Programming\real-estate-app\start-all.ps1
```

---

### Option 4: Manual (Full Control)

**Terminal 1 - Backend:**
```bash
cd d:\Programming\real-estate-app
npm start
# or
node server/app.js
```

**Terminal 2 - Frontend:**
```bash
cd d:\Programming\real-estate-app\frontend
npm start
# or
ng serve
```

---

## 📍 Access the Apps

Once both are running:

- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:4200`

---

## 🔄 How It Works

### Backend (Node.js + Express)
- Runs on port **5000**
- Provides REST API endpoints
- Connected to MongoDB
- Uses Gemini AI for property analysis

### Frontend (Angular 19)
- Runs on port **4200**
- Angular Dev Server with hot reload
- Tailwind CSS styling
- Makes API calls to backend

---

## 📊 Available npm Commands

From root directory:

```bash
npm run backend              # Start backend only
npm run frontend             # Start frontend only (requires cd)
npm run dev:all              # Start both (requires concurrently)
npm start                    # Start backend only (default)
npm run dev                  # Start backend only (alias)
```

---

## 🛠️ Installation

If this is your first time, install all dependencies:

```bash
# Install root dependencies (includes concurrently)
npm install

# Install frontend dependencies
cd frontend
npm install

# Back to root
cd ..
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Port 5000 (Backend):**
```bash
# Find process on port 5000
netstat -ano | findstr :5000
# Kill it (replace PID with the number shown)
taskkill /PID <PID> /F
```

**Port 4200 (Frontend):**
```bash
# Specify different port
cd frontend
ng serve --port 4300
```

### Frontend Not Connecting to Backend

1. Ensure backend is running: `http://localhost:5000`
2. Check browser console (F12) for errors
3. Verify API URL in `frontend/src/services/*.service.ts`

### Compilation Errors

```bash
cd frontend
npm install
ng build
```

### concurrently Not Installed

```bash
npm install concurrently
```

---

## 📝 Process Overview

```
EstateIQ Full Stack Running
├─ Backend (Node.js)
│  ├─ Port: 5000
│  ├─ Express API
│  ├─ MongoDB Connection
│  └─ Gemini AI Integration
│
└─ Frontend (Angular 19)
   ├─ Port: 4200
   ├─ Angular CLI
   ├─ Tailwind CSS
   └─ HttpClient API Calls
```

---

## 🎯 Development Workflow

1. **Make changes to frontend**: Auto-reloads at `http://localhost:4200`
2. **Make changes to backend**: Restart backend in its terminal
3. **Test API calls**: Use browser DevTools Network tab (F12)
4. **Check logs**: See output in respective terminal windows

---

## 🚀 Production Deployment

### Build Frontend
```bash
cd frontend
npm run build:prod
# Output: dist/estateiq-frontend/
```

### Run Backend in Production
```bash
NODE_ENV=production npm start
```

---

## ✨ Features Verification

Once both are running, test these:

- ✅ Home page loads with featured properties
- ✅ Properties list displays data from backend
- ✅ Valuation form submits and returns results
- ✅ Search works with natural language
- ✅ Investment score calculates correctly
- ✅ Dark/Light mode toggle works

---

## 📚 Additional Resources

- Frontend docs: `d:\Programming\real-estate-app\frontend\README.md`
- API docs: `d:\Programming\real-estate-app\frontend\API_INTEGRATION.md`
- Backend setup: `d:\Programming\real-estate-app\README.md`

---

## 🎉 All Set!

Your EstateIQ full stack is ready to run! Choose any option above and start developing.

Enjoy! 🏠✨
