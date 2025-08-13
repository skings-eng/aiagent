import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Bot,
  FileText,
  MessageCircle,
  Settings,
  Menu,
  X,
  BarChart3,
  Smartphone,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 判断是否为聊天页面（公开页面）
  const isChatPage = location.pathname === '/chat';
  
  const handleLogout = () => {
    logout();
    navigate('/chat');
  };

  // 所有导航项
  const allNavigation = [
    {
      name: '首页',
      href: '/home',
      icon: Home,
      current: location.pathname === '/home',
      adminOnly: true,
    },
    {
      name: 'AI聊天',
      href: '/chat',
      icon: MessageCircle,
      current: location.pathname === '/chat',
      adminOnly: false,
    },
    {
      name: '股票分析',
      href: '/stock',
      icon: BarChart3,
      current: location.pathname.startsWith('/stock'),
      adminOnly: true,
    },
    {
      name: 'Gemini配置',
      href: '/gemini',
      icon: Bot,
      current: location.pathname === '/gemini',
      adminOnly: true,
    },
    {
      name: '系统提示词',
      href: '/prompts',
      icon: FileText,
      current: location.pathname === '/prompts',
      adminOnly: true,
    },
    {
      name: 'LINE配置',
      href: '/line',
      icon: Smartphone,
      current: location.pathname === '/line',
      adminOnly: true,
    },
    {
      name: '系统设置',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings',
      adminOnly: true,
    },
  ];
  
  // 根据认证状态过滤导航项
  const navigation = allNavigation.filter(item => 
    !item.adminOnly || isAuthenticated
  );

  // 聊天页面的简化布局
  if (isChatPage) {
    return (
      <div className="min-h-screen">
        {/* 聊天页面内容 */}
        <main className="h-screen">
          <Outlet />
        </main>
      </div>
    );
  }

  // 管理页面的完整布局
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* 侧边栏 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 侧边栏头部 */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  管理后台
                </h1>
                <p className="text-xs text-gray-500">
                  AI智能助手
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* 用户信息和登出 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || '管理员'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'admin@example.com'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              登出
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="lg:pl-64">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* 面包屑导航 */}
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  <li>
                    <Link
                      to="/home"
                      className="text-gray-400 hover:text-gray-500 text-sm"
                    >
                      首页
                    </Link>
                  </li>
                  {location.pathname !== '/home' && (
                    <>
                      <li className="text-gray-300">/</li>
                      <li className="text-sm font-medium text-gray-900">
                        {navigation.find(item => item.href === location.pathname)?.name}
                      </li>
                    </>
                  )}
                </ol>
              </nav>
            </div>

            {/* 右侧操作区域 */}
            <div className="flex items-center space-x-4">
              <Link
                to="/chat"
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                返回聊天
              </Link>
              {/* AI助手标识 */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">AI 聊天助手</span>
              </div>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <main className="flex-1 p-6">
          <Outlet />
          
          {/* 页脚 */}
          <footer className="bg-gray-50 border-t border-gray-200 py-8 px-6 mt-12">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 text-sm text-gray-600">
                <a href="#" className="hover:text-blue-600 transition-colors">
                  使用条款
                </a>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  隐私政策
                </a>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  免责声明
                </a>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  联系我们
                </a>
              </div>
              <div className="text-center text-xs text-gray-500 mt-4">
               © 2025 AI智能助手. All rights reserved.
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;