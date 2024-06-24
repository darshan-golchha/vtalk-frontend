import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoomSelection from './components/RoomSelection';
import ChatPage from './components/ChatRoom';
import UserRegister from './components/UserRegistration';
import { LoadingProvider } from './components/Loader';

const App = () => {
  return (
    <LoadingProvider>
      <Router>
        <div>
          <Routes>
            <Route path="/" exact element={<UserRegister />} />
            <Route path="/rooms" element={<RoomSelection />} />
            <Route path="/chat/:roomCode/:username" element={<ChatPage />} />
          </Routes>
        </div>
      </Router>
    </LoadingProvider>
  );
};

export default App;
