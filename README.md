# ShoreAgents AI - Electron App

A modern Electron desktop application built with Next.js and Shadcn/ui.

## Features

- 🖥️ **Electron Desktop App** - Cross-platform desktop application
- ⚛️ **Next.js 15** - React framework with App Router
- 🎨 **Shadcn/ui** - Beautiful, accessible UI components
- 🎯 **TypeScript** - Type-safe development
- 🎨 **Tailwind CSS v3** - Utility-first CSS framework
- 📊 **Dashboard** - Interactive dashboard with charts and data tables

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

To run the app in development mode:

```bash
npm run electron-dev
```

This will:
- Start the Next.js development server
- Wait for the server to be ready
- Launch the Electron app

### Building for Production

To build the app for distribution:

```bash
npm run electron-build
```

This will:
- Build the Next.js app
- Export it as static files
- Package it with Electron

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js app
- `npm run electron` - Run Electron app (requires built app)
- `npm run electron-dev` - Run in development mode
- `npm run electron-build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test-db` - Test primary database connection
- `npm run test-bpoc-db` - Test BPOC database connection (for applicants)

## Project Structure

```
├── electron/
│   └── main.js          # Electron main process
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── dashboard/   # Dashboard page
│   │   └── globals.css  # Global styles
│   ├── components/      # React components
│   │   ├── ui/         # Shadcn/ui components
│   │   └── ...         # Custom components
│   └── hooks/          # Custom React hooks
├── public/             # Static assets
└── package.json        # Dependencies and scripts
```

## Dashboard Features

The app includes a comprehensive dashboard with:

- 📊 Interactive charts and graphs
- 📋 Data tables with sorting and filtering
- 🎨 Modern, responsive design
- 🌙 Dark/light theme support
- 📱 Mobile-responsive layout

## BPOC Database Integration

The app includes integration with a BPOC database for managing job applicants:

- 👥 **Applicants Management** - Drag and drop interface for application status tracking
- 📊 **Status Columns** - Submitted, Qualified, For Verification, Verified, Initial Interview, Final Interview, Not Qualified, Passed, Rejected, Withdrawn, Hired
- 🔄 **Real-time Updates** - Status changes are automatically saved to the database
- 📝 **Application Details** - View applicant information, job details, and company information

### Setup

1. Add `BPOC_DATABASE_URL` to your `.env.local` file
2. Run `npm run test-bpoc-db` to verify the connection
3. See `documents/BPOC_SETUP.md` for detailed setup instructions

## Technologies Used

- **Electron** - Desktop app framework
- **Next.js 15** - React framework
- **Shadcn/ui** - UI component library
- **Tailwind CSS v3** - CSS framework
- **TypeScript** - Type safety
- **Recharts** - Chart library
- **Lucide React** - Icons

## License

MIT
