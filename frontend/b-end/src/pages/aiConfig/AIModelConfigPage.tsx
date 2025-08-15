import React, { useState, useEffect } from 'react';
import { Key, TestTube, CheckCircle, XCircle, AlertCircle, Bot, Eye, EyeOff } from 'lucide-react';

interface AIModelConfig {
  provider: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// ModelOption接口已移除，当前使用手动输入模式

const AIModelConfigPage: React.FC = () => {
  const [config, setConfig] = useState<AIModelConfig>({
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4096
  });
  
  // 当前使用手动输入模式，支持所有主流AI模型
  
  // 根据选择的模型自动设置provider（当前使用手动输入模式）
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    aiResponse?: string;
  }>({ status: null, message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/v1/ai-models/config', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const configData = data.data || data;
        setConfig({
          provider: configData.provider || 'openai',
          apiKey: configData.apiKey || '',
          model: configData.model || 'gpt-4o',
          temperature: configData.temperature || 0.7,
          maxTokens: configData.maxTokens || 4096
        });
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const handleInputChange = (field: keyof AIModelConfig, value: string | number) => {
    // 确保数值字段的类型正确
    let processedValue = value;
    if (field === 'temperature' && typeof value === 'string') {
      processedValue = parseFloat(value) || 0.7;
    } else if (field === 'maxTokens' && typeof value === 'string') {
      processedValue = parseInt(value) || 4096;
    }
    
    setConfig(prev => ({ ...prev, [field]: processedValue }));
    setTestResult({ status: null, message: '' });
  };

  const testConnection = async () => {
    if (!config.apiKey.trim()) {
      setTestResult({
        status: 'error',
        message: '请先输入API密钥'
      });
      return;
    }

    setIsLoading(true);
    setTestResult({ status: null, message: '' });

    try {
      const testData = {
        ...config,
        message: '你是谁？'
      };
      
      const response = await fetch('/api/v1/ai-models/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          status: 'success',
          message: '连接测试成功！AI模型响应正常。',
          aiResponse: data.aiResponse || data.data?.aiResponse || '收到AI响应但内容为空'
        });
      } else {
        setTestResult({
          status: 'error',
          message: data.error || '连接测试失败'
        });
      }
    } catch (error) {
      setTestResult({
        status: 'error',
        message: '网络错误，请检查网络连接'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      console.log('Sending config data:', config);
      console.log('Config data types:', {
        provider: typeof config.provider,
        apiKey: typeof config.apiKey,
        model: typeof config.model,
        temperature: typeof config.temperature,
        maxTokens: typeof config.maxTokens
      });
      const response = await fetch('/api/v1/ai-models/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setTestResult({
          status: 'success',
          message: '配置保存成功！'
        });
      } else {
        const data = await response.json();
        setTestResult({
          status: 'error',
          message: data.error || '保存失败'
        });
      }
    } catch (error) {
      setTestResult({
        status: 'error',
        message: '保存失败，请重试'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI 模型配置</h1>
              <p className="text-gray-600">配置各种 AI 模型的 API 密钥和参数</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI 服务提供商
            </label>
            <select
              value={config.provider}
              onChange={(e) => handleInputChange('provider', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API 密钥 *
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={showApiKey ? config.apiKey : config.apiKey.replace(/./g, '*')}
                onChange={(e) => {
                  if (showApiKey) {
                    handleInputChange('apiKey', e.target.value);
                  }
                }}
                placeholder={`输入您的 ${config.provider.toUpperCase()} API 密钥`}
                className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{
                  fontFamily: showApiKey ? 'inherit' : 'monospace',
                  letterSpacing: showApiKey ? 'normal' : '0.1em'
                }}
                readOnly={!showApiKey}
              />
              <div className="absolute right-3 top-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title={showApiKey ? '隐藏API密钥' : '显示API密钥'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Key className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {config.provider === 'openai' && (
                <>您可以在 <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI 平台</a> 获取 API 密钥</>
              )}
              {config.provider === 'anthropic' && (
                <>您可以在 <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anthropic 控制台</a> 获取 API 密钥</>
              )}
              {config.provider === 'google' && (
                <>您可以在 <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a> 获取 API 密钥</>
              )}
            </p>
          </div>

          {/* Model Selection - Manual Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI 模型 *
            </label>
            <input
              type="text"
              value={config.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              placeholder={`输入模型名称，如：gpt-4o, claude-3-sonnet, gemini-1.5-pro`}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              {config.provider === 'openai' && '常用模型：gpt-4o, gpt-4, gpt-3.5-turbo'}
              {config.provider === 'anthropic' && '常用模型：claude-3-sonnet, claude-3-haiku, claude-3-opus'}
              {config.provider === 'google' && '常用模型：gemini-1.5-pro, gemini-1.0-pro'}
            </p>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              温度参数: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => handleInputChange('temperature', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>保守 (0.0)</span>
              <span>平衡 (0.7)</span>
              <span>创新 (1.0)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最大令牌数
            </label>
            <input
              type="number"
              min="1"
              max="8192"
              value={config.maxTokens}
              onChange={(e) => handleInputChange('maxTokens', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              控制生成回复的最大长度 (1-8192)
            </p>
          </div>

          {/* Test Result */}
          {testResult.status && (
            <div className={`p-4 rounded-lg ${
              testResult.status === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                {testResult.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    testResult.status === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </p>
                  {testResult.status === 'success' && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-2">发送内容：</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <p className="text-sm text-gray-700">你是谁？</p>
                        </div>
                      </div>
                      {testResult.aiResponse && (
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-2">AI 响应内容：</p>
                          <div className="bg-white border border-green-200 rounded-md p-3">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{testResult.aiResponse}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={testConnection}
              disabled={isLoading || !config.apiKey.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TestTube className="w-5 h-5" />
              <span>{isLoading ? '测试中...' : '测试连接'}</span>
            </button>
            
            <button
              onClick={saveConfig}
              disabled={isSaving || !config.apiKey.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>{isSaving ? '保存中...' : '保存配置'}</span>
            </button>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">安全提醒</p>
                <p>请妥善保管您的 API 密钥，不要在公共场所或不安全的环境中暴露。API 密钥将被加密存储。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModelConfigPage;