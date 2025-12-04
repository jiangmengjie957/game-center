import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GameDetail from './pages/GameDetail';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:gameId" element={<GameDetail />} />
    </Routes>
  );
};

export default AppRoutes;