# BuildMyFolio 2.0

An AI-powered portfolio and document builder that takes prompts or structured inputs and turns them into production-ready websites and single-page A4 PDF resumes. It couples Google Gemini / Gemma models with a visual GrapesJS flow editor and lossless MySQL native JSON persistence.

---

## What's under the hood

- **Frontend**: React 19, Vite, Tailwind CSS v4, GrapesJS (with webpage preset and responsive device managers), Lucide icons.
- **Backend**: Node.js, Express, `@google/generative-ai`, JWT authentication with bcrypt password hashing.
- **Database**: MySQL with native `JSON` columns for lossless visual editor trees, plus `LONGTEXT` caches for zero-overhead static HTML/CSS serving.
- **AI Engine**: Primary generation via `gemini-3.5-flash-lite` configured with high reasoning (`thinkingLevel: 'HIGH'`), backed by a fallback chain (`gemini-2.5-flash` → `gemma-4-31b-it` → `gemma-4-26b-a4b-it`).

---

## Core Capabilities

### 1. Archetype-Driven Layout Generation
Instead of generic prompt throwing, the generation pipeline injects tailored design tokens and structural constraints depending on the selected archetype:
- **Personal Portfolio (Website)**: Floating glass navigation, dynamic availability pill, Bento-style skills matrix, project showcase with live demo links, and contact card.
- **Resume (PDF)**: Single-page A4 canvas (`210mm × 297mm`), clean typography, metric-driven work experience bullets, education, and categorized skills.
- **Student Portfolio (PDF)**: A4 academic profile format highlighting research, honors/scholarships, leadership, and relevant coursework.
- **Startup Landing Page**: Modern SaaS page with hero badges, product UI previews, Bento feature grids, interactive FAQ accordions, and pricing tiers.
- **Agency Website & Product Showcase**: Editorial high-contrast typography, interactive case study cards, and specs breakdown tables.

### 2. The 60-30-10 Theming Engine
Arbitrary or custom themes (e.g. "Warm Scandinavian", "Emerald Forest", "Midnight Slate") are normalized through a 60-30-10 color rule. All palette colors are exposed as CSS variables on `#website-root` (`--bg`, `--surface`, `--border`, `--text`, `--accent`, `--accent-glow`), ensuring full visual harmony across generated pages and instant theme adjustments.

### 3. Visual Flow Editor (Webflow-Style Fluid Layouts)
The canvas operates in flow-based positioning where elements push and reflow sibling content naturally. All DOM elements are recursively configured to be resizable, so scaling a text box or container pushes adjacent blocks instead of overlapping them.

### 4. Floating AI Copilot (`Cmd+K` / `Ctrl+K`)
An interactive bottom palette inside the editor lets you iterate on existing pages in real time. The copilot accepts plain-language directives ("make buttons rounded with subtle purple glow", "add a working FAQ accordion") and applies surgical edits to the live HTML/CSS tree without wiping untouched elements.

### 5. Lossless JSON + Clean Export
The editor persists page state as raw GrapesJS component trees (`project_data` in MySQL). On export, it compiles the layout into a standalone, single-file HTML document with embedded CSS, Google Fonts, and functional scripts.

---

## Quickstart & Local Setup

### Prerequisites
- Node.js 18+ and npm
- MySQL Server 8.0+
- Google Gemini API Key ([get one here](https://aistudio.google.com/))

### 1. Database Setup
Log into your local MySQL shell and initialize the database schema:

```bash
mysql -u root -p < backend/schema.sql
```

This creates `buildmyfolio_db` with `users` and `projects` tables (including the `project_data JSON` column and composite index for fast dashboard queries).

### 2. Backend Configuration
Navigate to the `backend/` directory and set up your environment variables:

```bash
cd backend
cp .env.example .env # or create .env directly
```

Your `.env` file should look like this:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=AIzaSy...
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=buildmyfolio_db
```

Start the backend server:

```bash
npm install
npm start
```

The server will run on `http://localhost:5000`.

### 3. Frontend Setup
In a new terminal window, navigate to `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

The frontend will boot on `http://localhost:5173`.

---

## Architecture & Project Structure

```
buildmyfolio2.0/
├── backend/
│   ├── middleware/
│   │   ├── auth.js              # JWT validation middleware
│   │   └── rateLimiter.js       # In-memory IP/user rate limiting
│   ├── routes/
│   │   ├── ai.js                # Generation & surgical edit endpoints with fallback chain
│   │   ├── auth.js              # User registration & login with bcrypt
│   │   ├── payments.js          # Plan tier upgrades with whitelist validation
│   │   └── projects.js          # CRUD operations with JSON tree + HTML/CSS persistence
│   ├── db.js                    # MySQL2 pool configuration with keep-alive
│   ├── schema.sql               # Database table definitions & composite indexes
│   └── server.js                # Express app entrypoint, security headers & error handler
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx       # Adaptive top bar with plan badges and theme toggler
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Authentication state & user session manager
│   │   │   └── ThemeContext.jsx # Global dark / light mode manager
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx  # Marketing page with hero and pricing tables
│   │   │   ├── Login.jsx        # Login form
│   │   │   ├── Register.jsx     # Registration form
│   │   │   ├── Dashboard.jsx    # Projects grid, search, rename, and plan overview
│   │   │   ├── CreateProject.jsx# Multi-step AI builder with archetype schemas
│   │   │   ├── Editor.jsx       # GrapesJS visual editor, device viewports & AI copilot
│   │   │   ├── Upgrade.jsx      # Dedicated split-screen checkout page
│   │   │   └── NotFound.jsx     # 404 error page
│   │   ├── api.js               # Axios instance with auth interceptors
│   │   ├── App.jsx              # Client routing & protected routes
│   │   └── main.jsx             # React entrypoint
│   └── package.json
└── README.md
```

---

## API Summary

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | No | Register a new user account |
| `POST` | `/api/auth/login` | No | Authenticate user and receive signed 24h JWT |
| `GET` | `/api/projects` | Yes | List all projects belonging to the user |
| `POST` | `/api/projects` | Yes | Create project with JSON tree and HTML/CSS |
| `GET` | `/api/projects/:id` | Yes | Load single project into the editor |
| `PUT` | `/api/projects/:id` | Yes | Update project title, JSON tree, or HTML/CSS |
| `DELETE`| `/api/projects/:id` | Yes | Delete a project |
| `POST` | `/api/ai/generate` | Yes | Generate layout using archetype prompt + Gemini |
| `POST` | `/api/ai/edit` | Yes | Surgically modify active canvas HTML/CSS via copilot |
| `POST` | `/api/payments/checkout` | Yes | Upgrade plan tier (`Hobby`, `Pro`) |
| `GET` | `/api/health` | No | Service health check |

---

## Keyboard Shortcuts in Editor

- **`Cmd + K` / `Ctrl + K`**: Focus the floating AI Copilot prompt bar from anywhere on the canvas.
- **`Enter`**: Submit the AI edit or confirm project rename in Dashboard.
- **`Escape`**: Cancel project rename in Dashboard.
- **Top Toolbar**: Toggle between Desktop (100%), Tablet (768px), and Mobile (375px) viewports with one click.

---

## License

ISC License. Built for developers, designers, and creators looking to spin up portfolios and resumes with clean code and zero lock-in.
