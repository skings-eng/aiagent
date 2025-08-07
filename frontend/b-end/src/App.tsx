import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/home/HomePage';
import ChatPage from './pages/chat/ChatPage';
import GeminiConfigPage from './pages/gemini/GeminiConfigPage';
import SystemPromptsPage from './pages/prompts/SystemPromptsPage';
import LineConfigPage from './pages/line/LineConfigPage';
import SettingsPage from './pages/settings/SettingsPage';
import StockPage from './pages/stock/StockPage';
import StockOptimizationPage from './pages/stock/StockOptimizationPage';

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="stock/optimization" element={<StockOptimizationPage />} />
          <Route path="gemini" element={<GeminiConfigPage />} />
          <Route path="gemini-config" element={<GeminiConfigPage />} />
          <Route path="prompts" element={<SystemPromptsPage />} />
          <Route path="line" element={<LineConfigPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;