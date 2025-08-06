import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  CircleStackIcon,
  CloudIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import clsx from 'clsx';

interface SystemSettings {
  general: {
    systemName: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
    debugMode: boolean;
  };
  api: {
    rateLimit: number;
    timeout: number;
    retryAttempts: number;
    enableCaching: boolean;
    cacheExpiry: number;
  };
  ai: {
    defaultModel: string;
    maxTokens: number;
    temperature: number;
    enableFallback: boolean;
    fallbackModel: string;
  };
  security: {
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    twoFactorAuth: boolean;
    ipWhitelist: string[];
  };
  notifications: {
    email: {
      enabled: boolean;
      smtp: {
        host: string;
        port: number;
        username: string;
        password: string;
        encryption: 'none' | 'tls' | 'ssl';
      };
    };
    slack: {
      enabled: boolean;
      webhookUrl: string;
      channel: string;
    };
    alerts: {
      systemErrors: boolean;
      highUsage: boolean;
      securityEvents: boolean;
      maintenanceReminders: boolean;
    };
  };
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number;
    location: 'local' | 's3' | 'gcs';
    encryption: boolean;
  };
}

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'ai' | 'security' | 'notifications' | 'backup'>('general');
  const [hasChanges, setHasChanges] = useState(false);

  // Mock data - replace with actual API calls
  const { data: settings, isLoading } = useQuery<SystemSettings>(
    'settings',
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSettings: SystemSettings = {
        general: {
          systemName: 'Japan Stock AI',
          timezone: 'Asia/Tokyo',
          language: 'ja',
          maintenanceMode: false,
          debugMode: false,
        },
        api: {
          rateLimit: 1000,
          timeout: 30000,
          retryAttempts: 3,
          enableCaching: true,
          cacheExpiry: 3600,
        },
        ai: {
          defaultModel: 'gpt-4',
          maxTokens: 4000,
          temperature: 0.7,
          enableFallback: true,
          fallbackModel: 'gpt-3.5-turbo',
        },
        security: {
          sessionTimeout: 3600,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireNumbers: true,
            requireSymbols: true,
          },
          twoFactorAuth: true,
          ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
        },
        notifications: {
          email: {
            enabled: true,
            smtp: {
              host: 'smtp.gmail.com',
              port: 587,
              username: 'admin@japanstockai.com',
              password: '********',
              encryption: 'tls',
            },
          },
          slack: {
            enabled: false,
            webhookUrl: '',
            channel: '#alerts',
          },
          alerts: {
            systemErrors: true,
            highUsage: true,
            securityEvents: true,
            maintenanceReminders: false,
          },
        },
        backup: {
          enabled: true,
          frequency: 'daily',
          retention: 30,
          location: 's3',
          encryption: true,
        },
      };
      
      return mockSettings;
    }
  );

  const updateSettingsMutation = useMutation(
    async (newSettings: SystemSettings) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return newSettings;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        setHasChanges(false);
      },
    }
  );

  const handleSave = () => {
    if (settings) {
      updateSettingsMutation.mutate(settings);
    }
  };

  const tabs = [
    { id: 'general', name: '一般設定', icon: CogIcon },
    { id: 'api', name: 'API設定', icon: CloudIcon },
    { id: 'ai', name: 'AI設定', icon: DocumentTextIcon },
    { id: 'security', name: 'セキュリティ', icon: ShieldCheckIcon },
    { id: 'notifications', name: '通知設定', icon: BellIcon },
    { id: 'backup', name: 'バックアップ', icon: CircleStackIcon },
  ] as const;

  const renderTabContent = () => {
    if (!settings) return null;

    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                システム名
              </label>
              <input
                type="text"
                className="form-input"
                value={settings.general.systemName}
                onChange={(e) => {
                  settings.general.systemName = e.target.value;
                  setHasChanges(true);
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイムゾーン
              </label>
              <select
                className="form-select"
                value={settings.general.timezone}
                onChange={(e) => {
                  settings.general.timezone = e.target.value;
                  setHasChanges(true);
                }}
              >
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                デフォルト言語
              </label>
              <select
                className="form-select"
                value={settings.general.language}
                onChange={(e) => {
                  settings.general.language = e.target.value;
                  setHasChanges(true);
                }}
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">メンテナンスモード</h4>
                  <p className="text-sm text-gray-500">システムをメンテナンスモードにします</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => {
                      settings.general.maintenanceMode = e.target.checked;
                      setHasChanges(true);
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">デバッグモード</h4>
                  <p className="text-sm text-gray-500">詳細なログを出力します</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.general.debugMode}
                    onChange={(e) => {
                      settings.general.debugMode = e.target.checked;
                      setHasChanges(true);
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        );
      
      case 'api':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                レート制限 (リクエスト/分)
              </label>
              <input
                type="number"
                className="form-input"
                value={settings.api.rateLimit}
                onChange={(e) => {
                  settings.api.rateLimit = parseInt(e.target.value);
                  setHasChanges(true);
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイムアウト (ミリ秒)
              </label>
              <input
                type="number"
                className="form-input"
                value={settings.api.timeout}
                onChange={(e) => {
                  settings.api.timeout = parseInt(e.target.value);
                  setHasChanges(true);
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                リトライ回数
              </label>
              <input
                type="number"
                className="form-input"
                value={settings.api.retryAttempts}
                onChange={(e) => {
                  settings.api.retryAttempts = parseInt(e.target.value);
                  setHasChanges(true);
                }}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">キャッシュ有効</h4>
                  <p className="text-sm text-gray-500">APIレスポンスをキャッシュします</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.api.enableCaching}
                    onChange={(e) => {
                      settings.api.enableCaching = e.target.checked;
                      setHasChanges(true);
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
            
            {settings.api.enableCaching && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  キャッシュ有効期限 (秒)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={settings.api.cacheExpiry}
                  onChange={(e) => {
                    settings.api.cacheExpiry = parseInt(e.target.value);
                    setHasChanges(true);
                  }}
                />
              </div>
            )}
          </div>
        );
      
      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                デフォルトモデル
              </label>
              <select
                className="form-select"
                value={settings.ai.defaultModel}
                onChange={(e) => {
                  settings.ai.defaultModel = e.target.value;
                  setHasChanges(true);
                }}
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude-3</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大トークン数
              </label>
              <input
                type="number"
                className="form-input"
                value={settings.ai.maxTokens}
                onChange={(e) => {
                  settings.ai.maxTokens = parseInt(e.target.value);
                  setHasChanges(true);
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (0.0 - 1.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                className="form-input"
                value={settings.ai.temperature}
                onChange={(e) => {
                  settings.ai.temperature = parseFloat(e.target.value);
                  setHasChanges(true);
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">フォールバック有効</h4>
                <p className="text-sm text-gray-500">メインモデルが利用できない場合の代替モデル</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.ai.enableFallback}
                  onChange={(e) => {
                    settings.ai.enableFallback = e.target.checked;
                    setHasChanges(true);
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            {settings.ai.enableFallback && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  フォールバックモデル
                </label>
                <select
                  className="form-select"
                  value={settings.ai.fallbackModel}
                  onChange={(e) => {
                    settings.ai.fallbackModel = e.target.value;
                    setHasChanges(true);
                  }}
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3">Claude-3</option>
                  <option value="gemini-pro">Gemini Pro</option>
                </select>
              </div>
            )}
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                セッションタイムアウト (秒)
              </label>
              <input
                type="number"
                className="form-input"
                value={settings.security.sessionTimeout}
                onChange={(e) => {
                  settings.security.sessionTimeout = parseInt(e.target.value);
                  setHasChanges(true);
                }}
              />
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">パスワードポリシー</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最小文字数
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.security.passwordPolicy.minLength}
                    onChange={(e) => {
                      settings.security.passwordPolicy.minLength = parseInt(e.target.value);
                      setHasChanges(true);
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={settings.security.passwordPolicy.requireUppercase}
                      onChange={(e) => {
                        settings.security.passwordPolicy.requireUppercase = e.target.checked;
                        setHasChanges(true);
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">大文字を含む</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={settings.security.passwordPolicy.requireNumbers}
                      onChange={(e) => {
                        settings.security.passwordPolicy.requireNumbers = e.target.checked;
                        setHasChanges(true);
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">数字を含む</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={settings.security.passwordPolicy.requireSymbols}
                      onChange={(e) => {
                        settings.security.passwordPolicy.requireSymbols = e.target.checked;
                        setHasChanges(true);
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">記号を含む</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">二要素認証</h4>
                <p className="text-sm text-gray-500">すべてのユーザーに二要素認証を要求</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => {
                    settings.security.twoFactorAuth = e.target.checked;
                    setHasChanges(true);
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">メール通知</h4>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-700">メール通知を有効にする</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.notifications.email.enabled}
                    onChange={(e) => {
                      settings.notifications.email.enabled = e.target.checked;
                      setHasChanges(true);
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              {settings.notifications.email.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTPホスト
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={settings.notifications.email.smtp.host}
                        onChange={(e) => {
                          settings.notifications.email.smtp.host = e.target.value;
                          setHasChanges(true);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ポート
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={settings.notifications.email.smtp.port}
                        onChange={(e) => {
                          settings.notifications.email.smtp.port = parseInt(e.target.value);
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ユーザー名
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={settings.notifications.email.smtp.username}
                      onChange={(e) => {
                        settings.notifications.email.smtp.username = e.target.value;
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">アラート設定</h4>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">システムエラー</span>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={settings.notifications.alerts.systemErrors}
                    onChange={(e) => {
                      settings.notifications.alerts.systemErrors = e.target.checked;
                      setHasChanges(true);
                    }}
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">高使用率警告</span>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={settings.notifications.alerts.highUsage}
                    onChange={(e) => {
                      settings.notifications.alerts.highUsage = e.target.checked;
                      setHasChanges(true);
                    }}
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">セキュリティイベント</span>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={settings.notifications.alerts.securityEvents}
                    onChange={(e) => {
                      settings.notifications.alerts.securityEvents = e.target.checked;
                      setHasChanges(true);
                    }}
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">メンテナンス通知</span>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={settings.notifications.alerts.maintenanceReminders}
                    onChange={(e) => {
                      settings.notifications.alerts.maintenanceReminders = e.target.checked;
                      setHasChanges(true);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        );
      
      case 'backup':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">自動バックアップ</h4>
                <p className="text-sm text-gray-500">定期的なデータバックアップを有効にする</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.backup.enabled}
                  onChange={(e) => {
                    settings.backup.enabled = e.target.checked;
                    setHasChanges(true);
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            {settings.backup.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    バックアップ頻度
                  </label>
                  <select
                    className="form-select"
                    value={settings.backup.frequency}
                    onChange={(e) => {
                      settings.backup.frequency = e.target.value as any;
                      setHasChanges(true);
                    }}
                  >
                    <option value="daily">毎日</option>
                    <option value="weekly">毎週</option>
                    <option value="monthly">毎月</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    保存期間 (日)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.backup.retention}
                    onChange={(e) => {
                      settings.backup.retention = parseInt(e.target.value);
                      setHasChanges(true);
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    保存場所
                  </label>
                  <select
                    className="form-select"
                    value={settings.backup.location}
                    onChange={(e) => {
                      settings.backup.location = e.target.value as any;
                      setHasChanges(true);
                    }}
                  >
                    <option value="local">ローカル</option>
                    <option value="s3">Amazon S3</option>
                    <option value="gcs">Google Cloud Storage</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">暗号化</h4>
                    <p className="text-sm text-gray-500">バックアップファイルを暗号化する</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.backup.encryption}
                      onChange={(e) => {
                        settings.backup.encryption = e.target.checked;
                        setHasChanges(true);
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('settings.title')}
          </h1>
          <p className="mt-2 text-gray-600">
            システム設定の管理
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex space-x-3">
            <button
              className="btn-outline"
              onClick={() => {
                queryClient.invalidateQueries('settings');
                setHasChanges(false);
              }}
            >
              キャンセル
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={updateSettingsMutation.isLoading}
            >
              {updateSettingsMutation.isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 mr-2" />
              )}
              保存
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={clsx(
                      'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md',
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h2>
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {updateSettingsMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            設定が正常に保存されました
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;