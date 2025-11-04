import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Draw from './routes/Draw';
import DogPark from './routes/DogPark';
import Rankings from './routes/Rankings';
import MyDogs from './routes/MyDogs';
import UserInfo from './components/UserInfo';
import AutoMigrate from './components/AutoMigrate';
import { useUserStore } from './store/useUserStore';

function App() {
  const { initUserId } = useUserStore();

  // Initialize user ID on app load
  useEffect(() => {
    initUserId();
  }, [initUserId]);

  return (
    <div className="h-screen overflow-hidden">
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AutoMigrate />
        <UserInfo />
        <Routes>
          <Route path="/" element={<Draw />} />
          <Route path="/park" element={<DogPark />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/mydogs" element={<MyDogs />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
