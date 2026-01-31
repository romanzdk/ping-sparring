# Ping Sparring Frontend

Moderní React frontend pro Ping Sparring Marketplace aplikaci.

## Technologie

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Design Features

- Moderní, čistý design s Tailwind CSS
- Responzivní layout pro všechna zařízení
- Gradient pozadí a animace
- Glass morphism efekty
- Hover animace a transitions
- Loading states
- Error handling
- Toast notifications

## Instalace

```bash
npm install
```

## Vývoj

```bash
npm run dev
```

Aplikace běží na `http://localhost:5173`

## Build

```bash
npm run build
```

## Struktura

- `src/pages/` - Stránky (Login, Register, Dashboard, atd.)
- `src/components/` - Komponenty (Layout, atd.)
- `src/services/` - API služby
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript typy

## Hlavní stránky

- `/login` - Přihlášení
- `/register` - Registrace
- `/dashboard` - Dashboard s přehledem
- `/trainings` - Seznam tréninků s filtrováním
- `/trainings/:id` - Detail tréninku
- `/profile` - Uživatelský profil
- `/notifications` - Notifikace
