# Ticketing Electron App

A modern Electron desktop application built with Next.js and shadcn/ui, featuring a beautiful dashboard interface.

## Features

- 🖥️ **Electron Desktop App** - Cross-platform desktop application
- ⚡ **Next.js 15** - React framework with App Router
- 🎨 **shadcn/ui** - Beautiful and accessible UI components
- 📊 **Dashboard-01 Template** - Professional dashboard layout
- 🎯 **TypeScript** - Type-safe development
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🌙 **Dark Mode Support** - Built-in theme switching

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ticketing
```

2. Install dependencies:
```bash
npm install
```

## Development

### Start the development server

Run the app in development mode with hot reload:

```bash
npm run electron-dev
```

This command will:
1. Start the Next.js development server
2. Wait for the server to be ready
3. Launch the Electron app

### Alternative development commands

- `npm run dev` - Start only the Next.js development server
- `npm run electron` - Start only the Electron app (requires Next.js server to be running)

## Building for Production

### Build the application

```bash
npm run build
```

This creates a static export in the `out/` directory.

### Package the Electron app

```bash
npm run dist
```

This will:
1. Build the Next.js app
2. Package it with Electron
3. Create distributable files in the `dist/` directory

### Alternative build commands

- `npm run electron-pack` - Build and package the app
- `npm run build` - Build only the Next.js app

## Project Structure

```
ticketing/
├── electron/
│   └── main.js          # Electron main process
├── src/
│   ├── app/
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── globals.css  # Global styles
│   │   └── layout.tsx   # Root layout
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   └── ...          # Custom components
│   └── lib/
│       └── utils.ts     # Utility functions
├── package.json
├── next.config.js       # Next.js configuration
└── README.md
```

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js app for production
- `npm run start` - Start Next.js production server
- `npm run lint` - Run ESLint
- `npm run electron` - Start Electron app
- `npm run electron-dev` - Start development with hot reload
- `npm run electron-pack` - Build and package for distribution
- `npm run dist` - Create distributable files

## Customization

### Adding new shadcn/ui components

```bash
npx shadcn@latest add <component-name>
```

### Modifying the dashboard

The main dashboard is located at `src/app/dashboard/page.tsx`. You can customize:

- Layout components in `src/components/`
- UI components in `src/components/ui/`
- Data in `src/app/dashboard/data.json`

### Electron configuration

Modify `electron/main.js` to customize:
- Window size and properties
- App behavior
- Development vs production settings

## Troubleshooting

### Common issues

1. **Port 3000 already in use**
   - Kill the process using port 3000 or change the port in `electron/main.js`

2. **Build fails**
   - Ensure all dependencies are installed: `npm install`
   - Clear Next.js cache: `rm -rf .next out`

3. **Electron app doesn't start**
   - Check if Next.js dev server is running on port 3000
   - Verify `electron/main.js` exists and is properly configured

## License

MIT License - feel free to use this project for your own applications.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ using Next.js, Electron, and shadcn/ui
