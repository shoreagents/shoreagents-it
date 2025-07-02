# ShoreAgents Tauri App Setup

This is a Tauri application built with Next.js, featuring a login page with Supabase authentication.

## Prerequisites

- Node.js (v18 or higher)
- Rust (for Tauri)
- Supabase account
- Railway account (for backend)

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Development

To run the development server:

```bash
npm run dev
```

To run the Tauri development build:

```bash
npm run tauri dev
```

### 4. Build

To build the production version:

```bash
npm run build
npm run tauri build
```

## Branding Colors

The app uses the following ShoreAgents brand colors:

- Primary Green: `#7EAC0B`
- Secondary Green: `#97BC34`
- Accent Green: `#C3DB63`
- Accent Gray: `#F5F5F5`
- Font: Montserrat

## Features

- ✅ Next.js 15 with App Router
- ✅ TypeScript
- ✅ Tailwind CSS with custom branding
- ✅ Tauri for desktop app
- ✅ Supabase authentication
- ✅ Responsive login form
- ✅ Error handling
- ✅ Loading states

## Next Steps

1. Set up your Supabase project
2. Configure authentication in Supabase
3. Set up your Railway backend
4. Add more pages and features as needed 