import React, { useState, useEffect } from 'react';
import { Key, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

const GeminiConfigPage: React.FC = () => {
  const [config, setConfig] = useState<GeminiConfig>({
    apiKey: '',
    model: 'gemini-2.5-pro',
    temperature: 0.7,
    maxTokens: 4096
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await axios.get('/api/v1/ai-models/gemini/config');
      const configData = response.data.data || response.data;
      setConfig({
        apiKey: configData.apiKey || '',
        model: configData.model || 'gemini-2.5-pro',
        temperature: configData.temperature || 0.7,
        maxTokens: configData.maxTokens || 4096
      });
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const handleInputChange = (field: keyof GeminiConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
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
      await axios.post('/api/v1/ai-models/gemini/test', config);
      setTestResult({
        status: 'success',
        message: '连接测试成功！API密钥有效。'
      });
    } catch (error: any) {
       setTestResult({
         status: 'error',
         message: error.response?.data?.message || error.response?.data?.error || '连接测试失败'
       });
     } finally {
       setIsLoading(false);
     }
   };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      await axios.post('/api/v1/ai-models/gemini/config', config);
      setTestResult({
        status: 'success',
        message: '配置保存成功！'
      });
    } catch (error: any) {
      setTestResult({
        status: 'error',
        message: error.response?.data?.message || error.response?.data?.error || '保存失败，请重试'
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
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gemini API 配置</h1>
              <p className="text-gray-600">配置 Google Gemini 2.5 Pro API 密钥和参数</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API 密钥 *
            </label>
            <div className="relative">
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder="输入您的 Gemini API 密钥"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Key className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              您可以在 <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Google AI Studio</a> 获取 API 密钥
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              模型版本
            </label>
            <select
              value={config.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (推荐)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
            </select>
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
              onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
              onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              控制生成回复的最大长度 (1-8192)
            </p>
          </div>

          {/* Test Result */}
          {testResult.status && (
            <div className={`p-4 rounded-lg flex items-center space-x-3 ${
              testResult.status === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {testResult.status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm ${
                testResult.status === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.message}
              </span>
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
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default GeminiConfigPage;