<p align="center">
  <img src="public/logo.png" alt="Moniley Logo" width="150" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<h1 align="center">Moniley</h1>

<p align="center">
  <strong>Your AI-Powered Personal Finance Dashboard</strong>
</p>

<p align="center">
  <em>Track expenses, analyze spending habits, set budgets, and get personalized financial advice — all powered by Gemini AI.</em>
</p>

---

## Overview

**Moniley** is a full-stack personal finance management application built with **Next.js 16** and powered by **Google's Gemini AI**. It provides a modern, responsive dashboard where users can track income and expenses, manage budgets, set savings goals, generate financial reports, and chat with an AI financial advisor that has real-time access to their financial data.

> **Status:** Currently in Beta

---

## Key Features

### Financial Dashboard
- **Real-time financial snapshot** — Total balance, monthly income, expenses, and net savings at a glance
- **Expense breakdown** — Interactive donut chart powered by Recharts showing category-wise spending
- **Recent transactions** — Quick view of your latest financial activity
- **Global search** — Search transactions directly from the navbar

### AI-Powered Features
- **AI Financial Advisor (RAG Chatbot)** — Chat with Moniley AI, which has access to your real financial data including transactions, budgets, categories, and savings goals. Provides personalized, actionable advice with streaming responses.
- **Smart Transaction Categorization** — Type a natural language description (e.g., *"Bought 2 coffees for Rs 150 yesterday"*) and let Gemini AI automatically extract the amount, category, date, and description to auto-fill forms.

### Income & Expense Tracking
- Add, view, and delete income/expense transactions
- AI Smart Entry for hands-free form filling
- Category-based organization with datalist suggestions
- Running totals and transaction counts

### Category Management
- Create custom income and expense categories
- Categories are per-user and persist in the database
- AI-generated categories auto-save for future use

### Budget Management
- Set monthly budgets per category
- Visual progress bars showing spend vs. budget
- Over-budget warnings and visual indicators

### Savings Goals
- Define financial goals with target amounts and deadlines
- Track progress against your real savings (Income - Expenses)
- Visual progress cards with percentage completion

### Reports & Analytics
- **Monthly & Yearly reports** with period comparison
- **Bar charts** — Daily spending trends (monthly) or monthly trends (yearly)
- **Pie charts** — Expense breakdown by category
- **PDF Export** — Generate downloadable PDF reports with jsPDF

### User Profile
- View and edit display name
- Account stats (total transactions, active budgets)
- Member since date

### Settings
- **General** — Theme toggle, appearance preferences
- **Notifications** — Notification preferences
- **Security** — Password change, account deletion
- **Data** — Data export options

### Authentication
- **Email/Password** sign up & sign in
- **Google Sign-In** via Firebase Auth
- Password reset functionality
- Protected routes with `AuthGate` component

### Design & UX
- **Dark/Light mode** with smooth transitions
- **Emerald green** branded theme (oklch color system)
- **Glassmorphism** effects on navbar and landing page
- **Responsive design** — Works on mobile, tablet, and desktop
- **Collapsible sidebar** navigation
- **Poppins** typography from Google Fonts
- **Micro-animations** and hover effects throughout

---


## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Language** | [TypeScript 5](https://typescriptlang.org) |
| **UI Library** | [React 19](https://react.dev) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) + custom oklch design tokens |
| **UI Components** | [Radix UI](https://radix-ui.com) primitives + [shadcn/ui](https://ui.shadcn.com) |
| **Charts** | [Recharts 3](https://recharts.org) |
| **Authentication** | [Firebase Auth](https://firebase.google.com/docs/auth) (Email/Password + Google) |
| **Database** | [MongoDB 7](https://mongodb.com) (MongoDB Atlas) |
| **AI / LLM** | [Google Gemini 2.5 Flash](https://ai.google.dev) via `@google/genai` |
| **PDF Generation** | [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) |
| **Date Utilities** | [date-fns](https://date-fns.org) |
| **Password Hashing** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Theme** | [next-themes](https://github.com/pacocoursey/next-themes) |
| **Animations** | [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) |
| **Containerization** | Docker + Docker Compose |

---


l
├── Context/
│   ├── FirebaseAuthProvider.tsx       # Firebase auth context & hooks
│   └── Providers.tsx                  # Theme + Auth provider wrapper
├── hooks/
│   ├── use-auth.ts                    # useAuth() hook
│   └── use-mobile.ts                  # Responsive breakpoint hook
├── lib/
│   ├── firebase.ts                    # Firebase app initialization
│   ├── mongodb.js                     # MongoDB client singleton
│   ├── types.ts                       # Shared TypeScript types
│   └── utils.ts                       # Utility functions (cn, etc.)
├── public/
│   ├── logo.png                       # App logo
│   └── auth-bg.png                    # Auth page background image
├── Dockerfile                         # Multi-stage Docker build
├── docker-compose.yml                 # Docker Compose config
├── next.config.ts                     # Next.js configuration
├── tailwind.config.js                 # Tailwind CSS configuration
└── tsconfig.json                      # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- A **MongoDB Atlas** cluster (or local MongoDB instance)
- A **Firebase** project with Authentication enabled
- A **Google Gemini API** key

### 1. Clone the Repository

```bash
git clone https://github.com/adityaranjan-091/Moniley.git
cd Moniley
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Build for Production

```bash
npm run build
npm start
```

---

## Docker Deployment

Moniley ships with a multi-stage `Dockerfile` and a `docker-compose.yml` for easy containerized deployment.

### Using Docker Compose

```bash
# Build and run the container
docker compose up --build

# Run in detached mode
docker compose up --build -d
```

The app will be available at [http://localhost:3000](http://localhost:3000).

> **Note:** Firebase `NEXT_PUBLIC_*` variables are baked into the JS bundle at build time. Pass them as `--build-arg` flags or in your `.env` file before building.

---

## AI Architecture

### RAG-Based Financial Advisor

The AI chatbot uses a **Retrieval-Augmented Generation (RAG)** pattern:

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User Query │────▶│  Fetch Financial │────▶│   Build Context │
│             │     │  Data (MongoDB)  │     │   (RAG Snapshot)│
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                      │
                    ┌──────────────────┐     ┌────────▼────────┐
                    │  Stream Response │◀────│   Gemini Flash  │
                    │  (SSE to Client) │     │ + System Prompt │
                    └──────────────────┘     └─────────────────┘
```

**Context includes:** Monthly income/expenses, savings rate, budget status, expense breakdown, savings goals, recent transactions, and configured categories — all fetched in real-time from MongoDB.

### Smart Categorization

Uses Gemini AI to parse natural language transaction descriptions into structured data (amount, category, date, description) with JSON-mode output via `/api/smart-categorize`.

---

## Pages at a Glance

| Page | Description |
|---|---|
| `/` | Landing page with hero section and feature cards |
| `/login` | Email/password + Google sign-in |
| `/signup` | Account registration |
| `/dashboard` | Financial overview with charts |
| `/income` | Income transaction management |
| `/expense` | Expense tracking with AI Smart Entry |
| `/categories` | Custom category management |
| `/budgets` | Monthly budget creation & tracking |
| `/goals` | Savings goal tracker |
| `/reports` | Monthly/Yearly reports with PDF export |
| `/chat` | AI Financial Advisor chatbot |
| `/profile` | User profile & account stats |
| `/settings/general` | Theme & appearance preferences |
| `/settings/notifications` | Notification preferences |
| `/settings/security` | Password change & account deletion |
| `/settings/data` | Data export options |

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/dashboard` | `GET` | Aggregated financial snapshot |
| `/api/transactions` | `GET`, `POST`, `DELETE` | Income & expense CRUD |
| `/api/categories` | `GET`, `POST`, `DELETE` | Category CRUD |
| `/api/budgets` | `GET`, `POST`, `DELETE` | Budget CRUD |
| `/api/goals` | `GET`, `POST`, `DELETE` | Savings goals CRUD |
| `/api/reports` | `GET` | Monthly/yearly report data |
| `/api/profile` | `GET`, `PATCH` | User profile read/update |
| `/api/settings` | `GET`, `PATCH` | General settings |
| `/api/settings/data` | `GET` | Data export |
| `/api/chat` | `POST` | Gemini streaming chat (SSE) |
| `/api/chat/history` | `GET`, `POST`, `DELETE` | Conversation history CRUD |
| `/api/smart-categorize` | `POST` | AI-powered transaction parsing |

---

## Database Collections

| Collection | Description |
|---|---|
| `transactions` | Income and expense records |
| `categories` | User-defined categories (income/expense) |
| `budgets` | Monthly budget limits per category |
| `goals` | Savings goals with targets and deadlines |
| `chat_conversations` | AI chatbot conversation history |
| `users` | User profiles and account metadata |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built by <a href="https://github.com/adityaranjan-091">Aditya Ranjan</a>
</p>
