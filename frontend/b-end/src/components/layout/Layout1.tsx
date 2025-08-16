import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: 'ホーム',
      href: '/home',
      icon: Home,
      current: location.pathname === '/home',
    },
    {
      name: 'AIチャット',
      href: '/chat',
      icon: MessageCircle,
      current: location.pathname === '/chat',
    },
    {
      name: '株式分析',
      href: '/stock',
      icon: BarChart3,
      current: location.pathname.startsWith('/stock'),
    },
    {
      name: 'AIモデル設定',
      href: '/aiConfig',
      icon: Bot,
      current: location.pathname === '/aiConfig',
    },
    {
      name: 'システムプロンプト',
      href: '/prompts',
      icon: FileText,
      current: location.pathname === '/prompts',
    },
    {
      name: 'LINE設定',
      href: '/line',
      icon: Smartphone,
      current: location.pathname === '/line',
    },
    {
      name: 'システム設定',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* サイドバーオーバーレイ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* サイドバー */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out -translate-x-full ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* サイドバーヘッダー */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  股票AI分析
                </h1>
                <p className="text-xs text-gray-500">
                  智能投资助手
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

          {/* ナビゲーション */}
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
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="">
        {/* トップバー - home ページでのみ表示 */}
        {location.pathname === '/home' && (
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                {/* パンくずリスト */}
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

              {/* 右側のアクション */}
              <div className="flex items-center space-x-4">
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
        )}

        {/* ページコンテンツ */}
        <main className="flex-1">
          <Outlet />
          
          {/* フッター */}
          <footer className="bg-gray-50 border-t border-gray-200 py-8 px-6 mt-12">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 text-sm text-gray-600">
                <a href="#" className="hover:text-blue-600 transition-colors">
                  利用規約
                </a>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  プライバシーポリシー
                </a>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  免責事項
                </a>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  お問い合わせ
                </a>
              </div>
              <div className="text-center text-xs text-gray-500 mt-4">
                © 2024 智能投资助手. All rights reserved.
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;