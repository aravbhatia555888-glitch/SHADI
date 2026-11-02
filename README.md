# 💍 ShaadiBazaar

**Your Complete Wedding Planning Companion**

ShaadiBazaar is a cross-platform mobile and web application built with **React Native**, **Expo**, and **Supabase** to help couples plan their dream wedding. Browse vendors, manage budgets, track checklists, save favorites, and book services — all in one place.

---

## 📌 Project Status

The codebase builds and its tests pass, but it is **not deploy-ready out of the box** — the runtime is not configured and key flows have not been verified against a live backend.

- ✅ `npm run typecheck`, `npm run lint` and `npm test` (334 tests) pass; `npm run build-web` exports successfully.
- ⚠️ `.env` ships with **placeholder** Supabase credentials — the app cannot authenticate or load data until real values are set.
- ⚠️ AI features require a deployed `ai-proxy` Edge Function and `EXPO_PUBLIC_AI_PROXY_URL`.
- ⚠️ Payments require the Razorpay Edge Functions and keys.
- ❌ Native iOS/Android builds and authenticated flows have **not** been tested on device.

Run `node scripts/validate-codebase.js` and see `VALIDATION_REPORT.md` for the scoped status. `docs/UX_AUDIT.md` tracks UI/accessibility work; `docs/EXPERT_REVIEW.md` is superseded (see its correction notice).

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.86 + Expo SDK 57 (React 19) |
| Routing | Expo Router (file-based) |
| State Management | Zustand (with persistence) |
| Backend | Supabase (Auth, Database, Realtime) |
| Validation | Zod (runtime + compile-time) |
| Styling | React Native StyleSheet |
| Icons | Lucide React Native |
| Testing | Jest + React Native Testing Library |

---

## 📋 Prerequisites

- **Node.js** >= 18 (recommended: 20.x)
- **npm** or **yarn**
- **Expo CLI** — use `npx expo` (the standalone `expo-cli` package is deprecated)
- A **Supabase** project (free tier works)

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/shaadibazaar.git
cd shaadibazaar
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your **Supabase** credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Get these from your Supabase dashboard: **Project Settings → API**.
>
> **SECURITY**: The `SUPABASE_SERVICE_ROLE_KEY` must NEVER be in client .env files.
> It is only used by Supabase Edge Functions — set it via:
> `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key`

### 4. Set Up the Database

1. Go to your Supabase dashboard → **SQL Editor**
2. Open `supabase-setup.sql` from this repo
3. Run the entire script to create all tables, indexes, RLS policies, and sample data

### 5. Run the App

```bash
# Start the development server
npx expo start

# Or use the shorthand
npm start
```

Then press:
- `i` — Open in iOS simulator
- `a` — Open in Android emulator
- `w` — Open in web browser

---

## 📁 Project Structure

```
shaadibazaar/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Bottom tab screens
│   │   ├── home.tsx              # Dashboard with countdown, stats, quick actions
│   │   ├── checklist.tsx         # Wedding checklist management
│   │   ├── messages.tsx          # Vendor messages / inquiries
│   │   ├── vendors.tsx           # Vendor browsing & filtering
│   │   └── profile.tsx           # User profile & settings
│   ├── auth/                     # Auth screens (login, register, forgot password)
│   ├── booking/                  # Booking flow screens
│   ├── chat/                     # Chat interface
│   ├── inspiration/              # Wedding inspiration articles
│   ├── vendor/                   # Vendor detail screens
│   ├── _layout.tsx               # Root layout with headers & navigation
│   ├── index.tsx                 # Entry point with auth gate
│   └── ...
├── components/                   # Reusable UI components
│   ├── VendorCard.tsx
│   ├── ArticleCard.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── StarRating.tsx
│   └── ...
├── stores/                       # Zustand state management
│   ├── auth-store.ts             # Authentication state
│   ├── wedding-store.ts          # Wedding planning state
│   └── vendor-store.ts           # Vendor management state
├── schemas/                      # Zod validation schemas
│   ├── auth.ts
│   └── wedding.ts
├── types/                        # TypeScript type definitions
│   └── supabase.ts               # Generated Supabase types
├── config/                       # App configuration
│   ├── supabase.ts               # Supabase client setup
│   ├── firebase.ts               # Firebase config (future)
│   └── testing.ts                # Testing utilities
├── constants/                    # App constants
│   ├── colors.ts                 # Color palette
│   └── typography.ts             # Font sizes & weights
├── mocks/                        # Mock data for offline/demo mode
│   ├── vendors.ts
│   ├── checklist.ts
│   └── budget.ts
├── services/                     # API & external services
│   └── imageUpload.ts
├── utils/                        # Utility functions
│   └── api-validator.ts          # API validation helper
├── scripts/                      # Setup & utility scripts
│   ├── validate-codebase.js      # Codebase health check
│   └── setup-supabase.js         # Automated Supabase setup
├── supabase-setup.sql            # Database schema & seed data
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Environment template
├── app.json                      # Expo app configuration
└── package.json
```

---

## ✨ Features

### 🔐 Authentication
- Email/password sign up & sign in
- Password reset via email
- Profile management (name, wedding date, partner details)
- Change password
- Account deletion (soft delete)
- Session persistence across app restarts

### 💒 Wedding Planning
- **Dashboard** — Countdown timer, budget overview, pending tasks, featured vendors
- **Checklist** — Create, complete, and delete wedding tasks with priorities (high/medium/low)
- **Budget Tracker** — Set budget categories, add expenses, track spending vs. estimated
- **Wedding Details** — Couple name, wedding date, location, total budget

### 🏪 Vendor Management
- Browse vendors by category (Venue, Photography, Catering, Mehendi, Decoration, etc.)
- **Advanced Filtering** — Country, city, price range, rating, verified only
- **Search** — Full-text search across vendor names, descriptions, and locations
- **Grid/List View** — Toggle between compact and detailed views
- **Vendor Details** — Photos, features, services, packages, contact info, reviews
- **Favorites** — Save vendors for quick access
- **Reviews & Ratings** — Read and write reviews with photos
- **Booking** — Book vendors with date, package, and custom requirements
- **Inquiries** — Send messages to vendors

### 🔔 Real-Time Features
- Live checklist updates
- Real-time budget sync
- Collaborative planning between partners
- Cross-device synchronization

### 🎨 UI/UX
- Indian wedding color palette (Maroon & Gold)
- Smooth animations and transitions
- Global search across all content
- Responsive design for phones and tablets
- Loading states and error boundaries
- Offline fallback with mock data

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Validate codebase health
node scripts/validate-codebase.js
```

---

## 🚀 Building for Production

### iOS (requires Mac + Xcode)

```bash
# Build with EAS
npx eas build --platform ios

# Or build locally
npx expo run:ios --configuration Release
```

### Android

```bash
# Build with EAS
npx eas build --platform android

# Or build locally
npx expo run:android --variant release
```

### Web

```bash
# Build for web
npm run build-web

# Serve locally
npx serve web-build
```

> **Note:** EAS Build requires an Expo account. Set it up at [expo.dev](https://expo.dev).

---

## 🗄️ Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends Supabase Auth) |
| `vendors` | Vendor listings with geolocation |
| `vendor_reviews` | User reviews & ratings |
| `vendor_bookings` | Booking records with status tracking |
| `vendor_inquiries` | Messages between users and vendors |
| `checklist_items` | Wedding todo items |
| `budget_items` | Budget categories |
| `budget_expenses` | Individual expenses per category |
| `wedding_details` | Couple's wedding information |
| `favorite_vendors` | Saved vendor relationships |

All tables have **Row Level Security (RLS)** enabled. Users can only access their own data.

---

## 🔒 Security

- **Row Level Security (RLS)** on all database tables
- **Zod validation** on all API inputs
- **Password hashing** handled by Supabase Auth
- **Soft delete** for user accounts (protects data integrity)
- **Input sanitization** on search queries
- Environment variables never exposed in client code

---

## 🐛 Troubleshooting

### "No Supabase credentials found"
Ensure `.env` exists and contains valid `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### "Validation failed: Environment"
Run `cp .env.example .env` and fill in your real Supabase credentials.

### "Build failed: Missing icon"
Add app icons to `./assets/icon.png` (1024×1024px), `./assets/splash.png`, and `./assets/adaptive-icon.png`.

### "Module not found" errors
Run `npm install` to ensure all dependencies are installed.

### "Supabase table does not exist"
Run the `supabase-setup.sql` script in your Supabase SQL Editor.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 💬 Support

- 📧 Email: support@shaadibazaar.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/shaadibazaar/issues)
- 📖 Docs: See `API_DOCUMENTATION.md` and `VENDOR_API_DOCUMENTATION.md`

---

**Made with ❤️ for couples planning their perfect day.**
