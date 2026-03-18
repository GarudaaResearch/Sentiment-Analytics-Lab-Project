# SentiTeach — Sentiment Analytics Lab Tutor

An AI-powered educational agent for Sentiment Analytics lab courses, built with React + Express + Claude API.

---

## 🚀 Deploy to Render (Step-by-Step)

### Step 1 — Push to GitHub

1. Create a new repository on [github.com](https://github.com)
2. Run these commands in your terminal:

```bash
git init
git add .
git commit -m "Initial SentiTeach commit"
git remote add origin https://github.com/YOUR_USERNAME/sentiteach.git
git push -u origin main
```

---

### Step 2 — Create a Render Web Service

1. Go to [render.com](https://render.com) and sign in (free account works)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select the `sentiteach` repository
4. Fill in the settings:

| Field | Value |
|-------|-------|
| **Name** | sentiteach |
| **Environment** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

---

### Step 3 — Add your Anthropic API Key

1. In the Render dashboard, go to your service → **"Environment"** tab
2. Click **"Add Environment Variable"**
3. Set:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (your key from [console.anthropic.com](https://console.anthropic.com))
4. Click **Save Changes**

---

### Step 4 — Deploy

1. Click **"Deploy latest commit"** (or it auto-deploys)
2. Wait ~2 minutes for build to complete
3. Your app will be live at: `https://sentiteach.onrender.com`

---

## 🏃 Run Locally

```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# Start the server (serves both API + frontend)
npm start
```

Then open: http://localhost:5000

For frontend dev with hot reload:
```bash
# Terminal 1 — backend
node server.js

# Terminal 2 — frontend (dev mode)
npx vite
```

Create a `.env` file for local development:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

## 📁 Project Structure

```
sentiteach/
├── src/
│   ├── main.jsx        # React entry point
│   └── App.jsx         # Full SentiTeach UI
├── index.html          # HTML shell
├── server.js           # Express server + API proxy
├── vite.config.js      # Vite build config
├── package.json        # Dependencies & scripts
├── render.yaml         # Render deployment config
└── README.md
```

---

## 🔑 Architecture

```
Browser → React App → /api/chat (Express) → Anthropic Claude API
```

The API key is stored **server-side only** — never exposed to the browser.

---

## Features

- 8 Lab Programs with sidebar navigation
- 5 interaction modes: Explain, Lab, Quiz, Review, Concept Map
- Auto-mode detection from student messages
- Code blocks with syntax highlighting
- Full conversation memory per session
- Responsive layout
