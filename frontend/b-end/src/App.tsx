import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/home/HomePage';
import ChatPage from './pages/chat/ChatPage';
import AIModelConfigPage from './pages/aiConfig/AIModelConfigPage';
import SystemPromptsPage from './pages/prompts/SystemPromptsPage';
import LineConfigPage from './pages/line/LineConfigPage';
import SettingsPage from './pages/settings/SettingsPage';
import StockPage from './pages/stock/StockPage';
import StockOptimizationPage from './pages/stock/StockOptimizationPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* 登录页面 - 独立路由 */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* 主应用路由 */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/chat" replace />} />
            
            {/* 公开页面 - 用户可直接访问 */}
            <Route path="chat" element={<ChatPage />} />
            
            {/* 管理员页面 - 需要登录保护 */}
            <Route path="home" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="stock" element={
              <ProtectedRoute>
                <StockPage />
              </ProtectedRoute>
            } />
            <Route path="stock/optimization" element={
              <ProtectedRoute>
                <StockOptimizationPage />
              </ProtectedRoute>
            } />
            <Route path="aiConfig" element={
              <ProtectedRoute>
                <AIModelConfigPage />
              </ProtectedRoute>
            } />
            <Route path="prompts" element={
              <ProtectedRoute>
                <SystemPromptsPage />
              </ProtectedRoute>
            } />
            <Route path="line" element={
              <ProtectedRoute>
                <LineConfigPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;