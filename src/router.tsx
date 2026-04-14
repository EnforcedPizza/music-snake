import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage.js';
import { BrowsePage } from './pages/BrowsePage.js';
import { GamePage } from './pages/GamePage.js';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/browse" element={<BrowsePage />} />
      <Route path="/game/:artist" element={<GamePage />} />
    </Routes>
  );
}
