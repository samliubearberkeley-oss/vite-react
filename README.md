# ClubMatch

A modern, mobile-first web app for matching with people at the same venue (club/bar/party). Built with React + Vite and InsForge backend.

## Features

✨ **Core Features:**
- Simple email/password authentication + Google OAuth
- User profile setup with photo upload
- Venue selection (currently mock venues)
- Real-time active users list at selected venue
- Tap to match and start chatting
- AI-powered icebreaker generation

🎨 **UI/UX:**
- Beautiful gradient backgrounds
- Glassmorphism design
- Mobile-first responsive layout
- Smooth animations and transitions
- Real-time updates via polling

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** InsForge (Database, Auth, Storage, AI)
- **Icons:** Lucide React

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## Project Structure

```
cluby/
├── src/
│   ├── pages/
│   │   ├── AuthPage.jsx       # Login/Signup page
│   │   ├── ProfileSetup.jsx   # Profile creation
│   │   ├── VenueSelection.jsx # Venue selection
│   │   ├── ActiveUsers.jsx    # Active users list
│   │   ├── Chat.jsx           # Chat interface
│   │   └── Matches.jsx        # Matches list
│   ├── lib/
│   │   └── client.js          # InsForge client setup
│   ├── App.jsx                # Main app with routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── package.json
└── vite.config.js
```

## Backend Structure

- **Database Tables:**
  - `users` - User profiles
  - `venues` - Venue locations
  - `user_venues` - Active venue tracking
  - `matches` - User matches
  - `messages` - Chat messages

- **Storage:**
  - `avatars` bucket - User profile photos

## Usage Flow

1. **Sign Up/Login** - Create account or sign in with Google
2. **Setup Profile** - Add nickname, bio, and profile photo
3. **Select Venue** - Choose your current location
4. **Browse Users** - See active users at your venue
5. **Match** - Tap to match with someone
6. **Chat** - Start chatting with AI-generated icebreaker

## Environment Variables

The InsForge backend URL is configured in `src/lib/client.js`. Update it if your backend URL changes.

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

MIT

