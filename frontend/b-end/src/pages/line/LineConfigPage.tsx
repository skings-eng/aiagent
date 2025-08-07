import React, { useState, useEffect } from 'react';
import { MessageCircle, ExternalLink, Settings, CheckCircle, AlertCircle, Eye } from 'lucide-react';

interface LineConfig {
  url: string;
  displayText: string;
  description: string;
  triggerConditions: {
    afterMessages: number;
    stockAnalysis: boolean;
    randomChance: number;
  };
  isActive: boolean;
}

const LineConfigPage: React.FC = () => {
  const [config, setConfig] = useState<LineConfig>({
    url: '',
    displayText: 'LINE友達追加',
    description: 'LINEの公式アカウントを友達追加すると、リアルタイム株価アラート、限定の投資レポート、専門アナリストによる詳細分析をお届けします。',
    triggerConditions: {
      afterMessages: 3,
      stockAnalysis: true,
      randomChance: 30
    },
    isActive: true
  });
  const [, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });
  const [urlStatus, setUrlStatus] = useState<{
    status: 'checking' | 'valid' | 'invalid' | null;
    message: string;
  }>({ status: null, message: '' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/line/config');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // 处理后端返回的数据结构，设置默认值
          const configData = result.data;
          setConfig({
            url: configData.url || '',
            displayText: configData.displayText || 'LINE友達追加',
            description: configData.description || 'LINEの公式アカウントを友達追加すると、リアルタイム株価アラート、限定の投資レポート、専門アナリストによる詳細分析をお届けします。',
            triggerConditions: configData.triggerConditions || {
              afterMessages: 3,
              stockAnalysis: true,
              randomChance: 30
            },
            isActive: configData.isActive !== undefined ? configData.isActive : true
          });
        }
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUrl = async (url: string) => {
    if (!url.trim()) {
      setUrlStatus({ status: null, message: '' });
      return;
    }

    if (!url.startsWith('https://line.me/')) {
      setUrlStatus({
        status: 'invalid',
        message: 'URL 必须以 https://line.me/ 开头'
      });
      return;
    }

    setUrlStatus({ status: 'checking', message: '检查中...' });

    try {
      const response = await fetch('/api/v1/line/check-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setUrlStatus({
          status: 'valid',
          message: 'URL 有效'
        });
      } else {
        setUrlStatus({
          status: 'invalid',
          message: data.message || 'URL 无效或无法访问'
        });
      }
    } catch (error) {
      setUrlStatus({
        status: 'invalid',
        message: '无法验证 URL'
      });
    }
  };

  const handleUrlChange = (url: string) => {
    setConfig(prev => ({ ...prev, url }));
    setSaveResult({ status: null, message: '' });
    
    // Debounce URL checking
    setTimeout(() => checkUrl(url), 500);
  };

  const handleConfigChange = (field: keyof LineConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaveResult({ status: null, message: '' });
  };

  const handleTriggerChange = (field: keyof LineConfig['triggerConditions'], value: any) => {
    setConfig(prev => ({
      ...prev,
      triggerConditions: {
        ...prev.triggerConditions,
        [field]: value
      }
    }));
    setSaveResult({ status: null, message: '' });
  };

  const saveConfig = async () => {
    if (!config.url.trim()) {
      setSaveResult({
        status: 'error',
        message: 'LINE URL 不能为空'
      });
      return;
    }

    setIsSaving(true);
    setSaveResult({ status: null, message: '' });

    try {
      const response = await fetch('/api/v1/line/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSaveResult({
          status: 'success',
          message: 'LINE 配置保存成功！'
        });
      } else {
        const data = await response.json();
        setSaveResult({
          status: 'error',
          message: data.error || '保存失败'
        });
      }
    } catch (error) {
      setSaveResult({
        status: 'error',
        message: '保存失败，请重试'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const previewPromotion = () => {
    // Create a preview modal or popup
    const previewWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>LINE推广预览</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .promotion-card {
              background: white;
              border-radius: 12px;
              padding: 20px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              max-width: 300px;
              margin: 20px auto;
            }
            .promotion-title {
              font-size: 18px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .promotion-description {
              color: #666;
              margin-bottom: 15px;
              line-height: 1.4;
            }
            .promotion-tags {
              display: flex;
              gap: 8px;
              margin-bottom: 15px;
            }
            .tag {
              background: #e8f5e8;
              color: #2d5a2d;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
            }
            .promotion-button {
              background: #00c300;
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 8px;
              width: 100%;
              font-size: 14px;
              cursor: pointer;
            }
            .promotion-button:hover {
              background: #00a300;
            }
            .preview-info {
              text-align: center;
              color: #666;
              margin-bottom: 20px;
              padding: 10px;
              background: #fff3cd;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <div class="preview-info">
            <strong>LINE推广预览</strong><br>
            这是用户在聊天界面中看到的效果
          </div>
          <div class="promotion-card">
            <div class="promotion-title">${config.displayText || 'LINE官方账号'}</div>
            <div class="promotion-description">${config.description || '添加我们的LINE官方账号，获取更多服务和优惠信息！'}</div>
            <div class="promotion-tags">
              <span class="tag">官方认证</span>
              <span class="tag">即时回复</span>
              <span class="tag">专属优惠</span>
            </div>
            <button class="promotion-button" onclick="window.open('${config.url || 'https://line.me/'}', '_blank')">
              添加为好友
            </button>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            触发条件：${config.triggerConditions?.afterMessages || 3}条消息后显示<br>
            ${config.triggerConditions?.stockAnalysis ? '✓ 股票分析后显示' : '✗ 股票分析后显示'}<br>
            随机显示概率：${config.triggerConditions?.randomChance || 50}%
          </div>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LINE 广告链接管理</h1>
              <p className="text-gray-600">配置 LINE 好友添加链接和显示设置</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* LINE URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LINE 链接 *
            </label>
            <div className="relative">
              <input
                type="url"
                value={config.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://line.me/R/ti/p/@your-line-id"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
              />
              <ExternalLink className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
            </div>
            
            {/* URL Status */}
            {urlStatus.status && (
              <div className={`mt-2 flex items-center space-x-2 text-sm ${
                urlStatus.status === 'valid' ? 'text-green-600' :
                urlStatus.status === 'invalid' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {urlStatus.status === 'checking' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                {urlStatus.status === 'valid' && <CheckCircle className="w-4 h-4" />}
                {urlStatus.status === 'invalid' && <AlertCircle className="w-4 h-4" />}
                <span>{urlStatus.message}</span>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-1">
              请输入您的 LINE 官方账号链接，格式：https://line.me/R/ti/p/@your-line-id
            </p>
          </div>

          {/* Display Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              按钮文字
            </label>
            <input
              type="text"
              value={config.displayText}
              onChange={(e) => handleConfigChange('displayText', e.target.value)}
              placeholder="LINE友達追加"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              推广描述
            </label>
            <textarea
              value={config.description}
              onChange={(e) => handleConfigChange('description', e.target.value)}
              placeholder="描述添加 LINE 好友的好处..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Trigger Conditions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>显示条件设置</span>
            </h3>
            
            <div className="space-y-4">
              {/* After Messages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  消息数量触发：第 {config.triggerConditions.afterMessages} 条消息后显示
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={config.triggerConditions.afterMessages}
                  onChange={(e) => handleTriggerChange('afterMessages', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>第1条</span>
                  <span>第5条</span>
                  <span>第10条</span>
                </div>
              </div>

              {/* Stock Analysis Trigger */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="stockAnalysis"
                  checked={config.triggerConditions.stockAnalysis}
                  onChange={(e) => handleTriggerChange('stockAnalysis', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="stockAnalysis" className="text-sm text-gray-700">
                  在股票分析回复后显示
                </label>
              </div>

              {/* Random Chance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  随机显示概率：{config.triggerConditions.randomChance}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={config.triggerConditions.randomChance}
                  onChange={(e) => handleTriggerChange('randomChance', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={config.isActive}
              onChange={(e) => handleConfigChange('isActive', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              启用 LINE 推广功能
            </label>
          </div>

          {/* Save Result */}
          {saveResult.status && (
            <div className={`p-4 rounded-lg flex items-center space-x-3 ${
              saveResult.status === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {saveResult.status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm ${
                saveResult.status === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {saveResult.message}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={previewPromotion}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-5 h-5" />
              <span>预览效果</span>
            </button>
            
            <button
              onClick={saveConfig}
              disabled={isSaving || !config.url.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>{isSaving ? '保存中...' : '保存配置'}</span>
            </button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">使用说明</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>LINE 推广组件会根据设置的条件自动在聊天中显示</li>
                  <li>建议设置合适的显示频率，避免过度打扰用户体验</li>
                  <li>可以通过预览功能查看实际显示效果</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineConfigPage;