import React, { useState } from 'react';
import { Settings, Globe, Bell, User, Shield, Palette } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    marketNews: true,
    analysisUpdates: false,
    emailDigest: true,
  });
  const [theme, setTheme] = useState('light');
  const [currency, setCurrency] = useState('JPY');



  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const settingSections = [
    {
      id: 'language',
      title: '语言设置',
      icon: Globe,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            选择应用程序的显示语言
          </p>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="language"
                value="zh"
                checked={true}
                onChange={() => {}}
                className="text-blue-600"
              />
              <span>中文</span>
            </label>
          </div>
        </div>
      ),
    },
    {
      id: 'notifications',
      title: '通知设置',
      icon: Bell,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            选择您希望接收的通知类型
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  价格提醒
                </h4>
                <p className="text-sm text-gray-600">
                  当股票价格达到设定值时发送通知
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.priceAlerts}
                  onChange={(e) => handleNotificationChange('priceAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  市场新闻
                </h4>
                <p className="text-sm text-gray-600">
                  重要市场新闻的通知
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.marketNews}
                  onChange={(e) => handleNotificationChange('marketNews', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  AI分析更新
                </h4>
                <p className="text-sm text-gray-600">
                  新的AI分析结果通知
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.analysisUpdates}
                  onChange={(e) => handleNotificationChange('analysisUpdates', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  邮件摘要
                </h4>
                <p className="text-sm text-gray-600">
                  每周市场摘要邮件
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailDigest}
                  onChange={(e) => handleNotificationChange('emailDigest', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'display',
      title: '显示设置',
      icon: Palette,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              主题
            </h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === 'light'}
                  onChange={(e) => setTheme(e.target.value)}
                  className="text-blue-600"
                />
                <span>浅色</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.value)}
                  className="text-blue-600"
                />
                <span>深色</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="theme"
                  value="auto"
                  checked={theme === 'auto'}
                  onChange={(e) => setTheme(e.target.value)}
                  className="text-blue-600"
                />
                <span>跟随系统</span>
              </label>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              货币显示
            </h4>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="JPY">日元 (¥)</option>
              <option value="USD">美元 ($)</option>
              <option value="EUR">欧元 (€)</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      id: 'account',
      title: '账户设置',
      icon: User,
      content: (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">用户名</h4>
              <p className="text-sm text-gray-600">user@example.com</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="font-medium text-gray-900">
                编辑个人资料
              </div>
              <div className="text-sm text-gray-600">
                修改姓名、邮箱地址等信息
              </div>
            </button>
            
            <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="font-medium text-gray-900">
                修改密码
              </div>
              <div className="text-sm text-gray-600">
                为了安全建议定期更改密码
              </div>
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'privacy',
      title: '隐私与安全',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="font-medium text-gray-900">
                数据导出
              </div>
              <div className="text-sm text-gray-600">
                下载您的数据
              </div>
            </button>
            
            <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="font-medium text-gray-900">
                删除账户
              </div>
              <div className="text-sm text-gray-600">
                删除账户和所有数据
              </div>
            </button>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">
                  关于安全
                </h4>
                <p className="text-sm text-yellow-800 mt-1">
                  您的投资数据已加密并得到安全保护。
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                设置
              </h1>
              <p className="text-sm text-gray-500">
                管理应用程序设置
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {settingSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div key={section.id} className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-medium text-gray-900">{section.title}</h2>
                  </div>
                </div>
                <div className="px-6 py-4">{section.content}</div>
              </div>
            );
          })}
        </div>

        {/* 保存ボタン */}
        <div className="mt-8 flex justify-end space-x-3">
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            取消
          </button>
          <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;