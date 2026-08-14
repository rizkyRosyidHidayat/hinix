# HiNix - Personal Operating System

HiNix is a sleek, offline-first personal operating system built as a modern web app. It provides a unified command-line inspired interface combined with a beautiful GUI to help you manage your daily life.

## 🚀 Features

- **Command Architecture**: Type commands directly into the terminal interface to navigate and execute actions quickly.
- **Offline-First Storage**: All your data stays securely on your device using IndexedDB (powered by Dexie).
- **Dynamic Dashboard**: A beautiful, customizable dashboard that summarizes your day and shows what's up next.
- **Built-in Modules**:
  - ✅ **Tasks (Todo)**: Manage your daily tasks and to-do lists.
  - 💰 **Budget**: Track your daily expenses, income, and overall financial health.
  - 📅 **Schedule**: Plan your upcoming events and appointments.
  - ⏱️ **Timer**: Set pomodoro timers and countdowns.
  - 📝 **Notes**: Save text notes and pin important ones to your dashboard.
  - 🧮 **Calculator**: Perform calculations on the fly.
- **Feature Toggles**: Fully customize your experience by enabling or disabling modules via the Settings page or the CLI.
- **Premium Design**: Built with modern UI patterns featuring a gorgeous dark mode.

## 🛠️ Tech Stack

- **Framework**: SvelteKit (using Svelte 5 Runes)
- **Styling**: Tailwind CSS v4 + Shadcn-svelte
- **Database**: Dexie.js (IndexedDB)
- **Icons**: Lucide Svelte

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- [pnpm](https://pnpm.io/) (recommended)

### Installation

1. Install the project dependencies:
```sh
pnpm install
```

2. Start the development server:
```sh
pnpm run dev
```

3. Open your browser and navigate to `http://localhost:5173`.

### Building for Production

To create a production version of the app:
```sh
pnpm run build
```

You can preview the production build with:
```sh
pnpm run preview
```
