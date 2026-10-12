# Playbook: Merging Frontend & Backend into a Single Render Web Service

> **Purpose:** This guide provides step-by-step instructions for converting a separate Frontend (Vite/React) and Backend (Node/Express) repository into a **single unified full-stack web service** deployed on Render's free tier. 
> 
> Feeding this prompt/document to an AI agent or developer will allow them to execute this pattern across any monorepo project without trial-and-error.

---

## 1. Why Unified Deployment?
* **Single URL:** Both the client and API live under one domain (e.g., `https://myapp.onrender.com`).
* **No CORS Issues in Production:** Since the frontend and backend share the exact same origin, browser requests from the UI to `/api/*` are same-origin.
* **100% Free Tier Friendly:** Avoids consuming two separate Render services (saving memory limits, spin-up delays, and blueprint/credit card requirements).

---

## 2. Directory Structure Assumption
```text
my-project/
├── frontend/          # Vite / React app
│   ├── dist/          # Output of npm run build
│   ├── package.json
│   ├── vite.config.js
│   └── src/
└── backend/           # Node.js / Express app
    ├── package.json
    ├── server.js
    └── src/
        ├── app.js
        └── routes/
```

---

## 3. Step 1: Configure Frontend for Relative API URLs

When both services share a domain, the frontend in production should query relative endpoints (e.g. `/api/auth/login`) instead of absolute URLs (`http://localhost:5000/api/...`).

### 1.1 Update `frontend/.env.production`
Create or edit `frontend/.env.production`:
```env
VITE_API_URL=/api
```

### 1.2 Update `frontend/.env` (Local Development)
Ensure local dev still targets the local backend server:
```env
VITE_API_URL=http://localhost:5000/api
```

### 1.3 Update Axios / Fetch Base URL
Ensure your API client uses the environment variable:
```javascript
// frontend/src/services/api.js (or axios client setup)
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

export default api;
```

---

## 4. Step 2: Configure Express Backend to Serve Frontend

In production, Express needs to serve the static built files from `frontend/dist` and fallback unknown client routes to `index.html` (for React Router client-side routing).

### 4.1 Update `backend/src/app.js` (or `server.js`)

> ⚠️ **CRITICAL GOTCHAS:**
> 1. **Middleware Order:** The static files and catch-all route MUST be placed **AFTER** all `/api/*` routes, but **BEFORE** the 404 and global error-handling middlewares!
> 2. **Express v5 Compatibility:** If using Express 5.x (`"express": "^5.x"`), **DO NOT use `'*'` as a route string** (`app.get('*', ...)`). The underlying `path-to-regexp` v8 parser will throw a `PathError: Missing parameter name at index 1: *` crash. Instead, pass the regex `/.*/` directly: `app.get(/.*/, ...)`.
> 3. **ES Module Imports:** In Node.js ES Modules (`"type": "module"`), all `import` statements must remain at the top of the file.
> 4. **Helmet CSP:** If `helmet()` is enabled, disable Content Security Policy or configure script sources, otherwise it may block Vite asset chunks.

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';

// ... other imports and routes ...

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Disable CSP so Vite React scripts can load smoothly without blocking
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS setup (still useful for local development and specific origins)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS blocked'), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API ROUTES FIRST ---
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
// ... other API routes ...

// --- SERVE FRONTEND STATIC FILES IN PRODUCTION ---
if (process.env.NODE_ENV === 'production') {
  // Path from backend/src/app.js to frontend/dist
  const distPath = path.resolve(__dirname, '../../frontend/dist');
  
  app.use(express.static(distPath));

  // Express v5 safe catch-all for React Router SPA
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// --- ERROR HANDLING MIDDLEWARES MUST BE LAST ---
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
```

---

## 5. Step 3: Server Port Binding
Render provides a dynamic port in the `PORT` environment variable (usually `10000`). Never hardcode `5000`.

In `backend/server.js`:
```javascript
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
```

---

## 6. Step 4: Render Service Configuration

In Render Dashboard, create a **New +** -> **Web Service** (Connect your GitHub repository).

### 6.1 Settings
* **Name:** `your-app-name`
* **Region:** Any (e.g., Oregon, Frankfurt)
* **Branch:** `main`
* **Root Directory:** *(Leave blank / empty)*
* **Environment / Runtime:** `Node`

### 6.2 Build Command
```bash
cd frontend && npm install --include=dev && npm run build && cd ../backend && npm install
```

> 💡 **Why `--include=dev`?**  
> If Render runs in a production environment context, standard `npm install` skips `devDependencies`. Since Vite and `@vitejs/plugin-react` are typically in `devDependencies`, `npm run build` will fail with `Cannot find package '@vitejs/plugin-react'`. `--include=dev` guarantees Vite dependencies are installed for the build phase.

### 6.3 Start Command
```bash
cd backend && npm start
```
*(Ensure `backend/package.json` contains `"scripts": { "start": "node server.js" }`)*

---

## 7. Step 5: Required Environment Variables in Render

Navigate to **Environment** tab on your Render Web Service and add:

| Key | Example Value | Note |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Signals Express to serve static files from `frontend/dist` |
| `VITE_API_URL` | `/api` | Baked into frontend during the build step |
| `MONGODB_URI` | `mongodb+srv://...` | Connection string to your database |
| `JWT_SECRET` | `your_secret_key` | Secret key for auth tokens |
| Any 3rd party secrets | `...` | Google Client ID/Secret, Stripe keys, IMAP credentials, etc. |

---

## 8. Common Pitfalls & How to Avoid Them

### ❌ Issue 1: `Cannot find package '@vitejs/plugin-react'`
* **Cause:** Production npm install skips dev dependencies.
* **Fix:** Ensure the build command explicitly includes `--include=dev` in the frontend directory: `cd frontend && npm install --include=dev && npm run build`.

### ❌ Issue 2: `PathError [TypeError]: Missing parameter name at index 1: *`
* **Cause:** Express 5.x broke string wildcard routes `app.get('*', ...)`.
* **Fix:** Change `app.get('*', ...)` to `app.get(/.*/, ...)`.

### ❌ Issue 3: Express returns 404 for all frontend pages / routes
* **Cause:** `app.use(express.static(...))` and `app.get(/.*/, ...)` were placed below the 404 `notFound` middleware.
* **Fix:** Place the static file serving section above `notFound` and `errorHandler`.

### ❌ Issue 4: MongoDB Atlas Connection Error (`Could not connect to any servers... IP whitelist`)
* **Cause:** Render instances use dynamic IP addresses.
* **Fix:** In MongoDB Atlas -> **Network Access** -> **+ Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** -> Confirm.

### ❌ Issue 5: Google OAuth: `Invalid Origin: URIs must not contain a path`
* **Cause:** Pasted a path (`/api/auth/callback`) into the origin field in Google Cloud Console.
* **Fix:**
  * **Authorized JavaScript origins:** Only domain with protocol, NO trailing slash (e.g. `https://myapp.onrender.com`).
  * **Authorized redirect URIs:** Full path (e.g. `https://myapp.onrender.com/api/auth/google/callback`).
