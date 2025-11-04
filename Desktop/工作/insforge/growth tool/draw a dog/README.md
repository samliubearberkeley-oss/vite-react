# 🐶 Draw a Dog!

A viral web app where users draw dogs, get AI-scored, and watch them run in a shared Dog Park!

## 🚀 Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Canvas**: fabric.js
- **State**: Zustand
- **Backend**: Insforge (Auth, DB, Storage)
- **Routing**: react-router-dom

## ✨ Features

- 🎨 **Draw a Dog**: Free-form drawing canvas with real-time scoring
- 🤖 **AI Scoring**: Mock AI that evaluates dog-likeness (0-100%)
- 🏃 **Make it Run**: Upload your dog when score ≥ 63%
- 🏞️ **Dog Park**: Animated park where all dogs run around
- 🏆 **Rankings**: Top cute dogs & most creative/unhinged dogs
- 📁 **My Dogs**: View your personal collection
- 🔑 **No Login Required**: Auto-generated UUID with backend verification
- 👤 **User Identity**: Each user gets a unique ID displayed in top-right corner
- 🔒 **Privacy First**: No personal data collected, fully anonymous

## 🛠️ Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
Create `.env` file:
```
VITE_INSFORGE_PROJECT_ID=your_project_id
```

3. **Set up Insforge**:
   - Create a storage bucket named `dog-images`
   - Create database tables (see `SETUP.md` for detailed instructions):
     ```sql
     -- Users table for unique user tracking
     CREATE TABLE users (
       id TEXT PRIMARY KEY,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );

     -- Dogs table for drawings
     CREATE TABLE dogs (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id TEXT NOT NULL REFERENCES users(id),
       image_url TEXT NOT NULL,
       score DECIMAL NOT NULL,
       likes INTEGER DEFAULT 0,
       dislikes INTEGER DEFAULT 0,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     ```

4. **Run dev server**:
```bash
npm run dev
```

## 📁 Project Structure

```
src/
  main.jsx          # Entry point
  App.jsx           # Router setup
  index.css         # Global styles (crayon theme)
  routes/           # Page components
    Draw.jsx        # Main drawing page
    DogPark.jsx     # Animated park view
    Rankings.jsx    # Top dogs rankings
    MyDogs.jsx      # User's collection
  components/       # Reusable components
    CanvasBoard.jsx # Drawing canvas
    ScoreBar.jsx    # Score display
    DogCard.jsx     # Dog card component
    UserInfo.jsx    # User ID display widget
  store/            # Zustand stores
    useUserStore.js # User ID management
    useDogStore.js  # Dogs state
  lib/              # Utilities
    insforgeClient.js # Insforge client setup
    mockInsforge.js   # Mock client for local dev
    uploadDog.js      # Dog upload & fetch functions
    userApi.js        # User registration & verification
```

## 🎨 Visual Theme

**童话蜡笔风 (Crayon/Chalkboard Style)**:
- Hand-drawn borders
- Paper texture backgrounds
- Comic Sans font family
- Soft gradients (sky blue to grass green)
- Playful animations

## 🎮 How It Works

### User Flow
1. **First Visit**: System auto-generates unique UUID and registers with backend
2. **User Identity**: ID displayed in top-right corner (click to copy full ID)
3. **Draw**: User draws a dog on canvas
4. **Score**: Real-time mock scoring (0-100%)
5. **Publish**: If score ≥ 63%, "Make it Run!" uploads to Insforge
6. **Social**: View all dogs in Dog Park, vote with like/dislike
7. **Collection**: View your own dogs in "My Dogs" section

### User Uniqueness Guarantee
- **Layer 1**: UUID v4 (5.3×10^36 possible values)
- **Layer 2**: Backend database PRIMARY KEY constraint
- **Layer 3**: localStorage persistence per device
- See `docs/USER_UNIQUENESS.md` for detailed explanation

## 🚧 Next Steps

- Replace mock AI scoring with real AI API
- Add share functionality (Twitter, WeChat, etc.)
- Add more animations and effects
- Implement real-time updates (via Insforge subscriptions)

## 📝 License

MIT
